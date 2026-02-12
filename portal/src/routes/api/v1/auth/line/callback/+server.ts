import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { exchangeLineCode, getLineProfile } from '$lib/server/line-oauth';
import { generateId, createAccessToken, createRefreshToken } from '$lib/server/auth';

const DEV_JWT_SECRET = 'tcex-dev-jwt-secret-do-not-use-in-production';

export const GET: RequestHandler = async ({ url, platform, getClientAddress }) => {
	if (!platform?.env?.DB || !platform?.env?.SESSIONS) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const error = url.searchParams.get('error');

	if (error) {
		throw redirect(303, '/login?error=line_denied');
	}

	if (!code || !state) {
		throw redirect(303, '/login?error=line_invalid');
	}

	const channelId = platform.env.LINE_CHANNEL_ID;
	const channelSecret = platform.env.LINE_CHANNEL_SECRET;
	const redirectUri = platform.env.LINE_REDIRECT_URI;
	const jwtSecret = platform.env.JWT_SECRET || DEV_JWT_SECRET;

	if (!channelId || !channelSecret || !redirectUri) {
		throw redirect(303, '/login?error=line_not_configured');
	}

	const db = platform.env.DB;
	const kv = platform.env.SESSIONS;

	// Verify state
	const stateData = await kv.get(`line_state:${state}`);
	if (!stateData) {
		throw redirect(303, '/login?error=line_invalid_state');
	}
	await kv.delete(`line_state:${state}`);

	const { userId: linkingUserId } = JSON.parse(stateData) as { userId: string | null };

	// Exchange code for token
	let lineTokens;
	try {
		lineTokens = await exchangeLineCode(code, channelId, channelSecret, redirectUri);
	} catch {
		throw redirect(303, '/login?error=line_token_failed');
	}

	// Get LINE profile
	let lineProfile;
	try {
		lineProfile = await getLineProfile(lineTokens.access_token);
	} catch {
		throw redirect(303, '/login?error=line_profile_failed');
	}

	const now = new Date().toISOString();

	// Check if LINE account is already linked
	const existingLink = await db
		.prepare('SELECT id, user_id FROM line_accounts WHERE line_user_id = ?')
		.bind(lineProfile.userId)
		.first<{ id: string; user_id: string }>();

	// Case 1: Linking to existing logged-in user
	if (linkingUserId) {
		if (existingLink) {
			if (existingLink.user_id === linkingUserId) {
				throw redirect(303, '/dashboard/settings?line=already_linked');
			}
			throw redirect(303, '/dashboard/settings?line=linked_other');
		}

		// Link LINE account to user
		await db
			.prepare(
				`INSERT INTO line_accounts (id, user_id, line_user_id, display_name, picture_url, created_at, updated_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(generateId(), linkingUserId, lineProfile.userId, lineProfile.displayName, lineProfile.pictureUrl || null, now, now)
			.run();

		await db
			.prepare(
				`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, ip_address, created_at)
				 VALUES (?, ?, 'line_linked', 'user', ?, ?, ?, ?)`
			)
			.bind(generateId(), linkingUserId, linkingUserId, `LINE: ${lineProfile.displayName}`, getClientAddress(), now)
			.run();

		throw redirect(303, '/dashboard/settings?line=linked');
	}

	// Case 2: Login via LINE (existing link)
	if (existingLink) {
		const user = await db
			.prepare('SELECT id, email, display_name, kyc_level, status, email_verified, totp_enabled FROM users WHERE id = ?')
			.bind(existingLink.user_id)
			.first<{
				id: string;
				email: string;
				display_name: string | null;
				kyc_level: number;
				status: string;
				email_verified: number | null;
				totp_enabled: number | null;
			}>();

		if (!user || user.status !== 'active') {
			throw redirect(303, '/login?error=account_disabled');
		}

		const tokenPayload = {
			sub: user.id,
			email: user.email,
			displayName: user.display_name,
			kycLevel: user.kyc_level,
			emailVerified: !!(user.email_verified),
			totpEnabled: !!(user.totp_enabled)
		};

		const accessToken = await createAccessToken(tokenPayload, jwtSecret);
		const refreshToken = await createRefreshToken(tokenPayload, jwtSecret);

		await kv.put(`session:${user.id}:${refreshToken.slice(-16)}`, JSON.stringify({
			userId: user.id,
			createdAt: now,
			ip: getClientAddress()
		}), { expirationTtl: 7 * 24 * 60 * 60 });

		await db
			.prepare(
				`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, ip_address, created_at)
				 VALUES (?, ?, 'login_line', 'user', ?, ?, ?, ?)`
			)
			.bind(generateId(), user.id, user.id, `LINE: ${lineProfile.displayName}`, getClientAddress(), now)
			.run();

		// Redirect with token in fragment (client-side retrieval)
		const response = new Response(null, {
			status: 303,
			headers: {
				Location: `/?lineLogin=success&token=${accessToken}`,
				'Set-Cookie': `refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=${7 * 24 * 60 * 60}`
			}
		});
		return response;
	}

	// Case 3: No existing link, not logged in — redirect to register/link page
	throw redirect(303, `/login?line_user=${lineProfile.userId}&line_name=${encodeURIComponent(lineProfile.displayName)}`);
};
