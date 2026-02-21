import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { exchangeGoogleCode, getGoogleProfile } from '$lib/server/google-oauth';
import {
	generateId,
	createAccessToken,
	createRefreshToken,
	createLogin2faToken,
	resolveJwtSecret,
	ACCESS_TOKEN_MAX_AGE,
	REFRESH_TOKEN_MAX_AGE,
	LOGIN_2FA_TOKEN_MAX_AGE
} from '$lib/server/auth';

export const GET: RequestHandler = async ({ url, platform, cookies, getClientAddress }) => {
	if (!platform?.env?.DB || !platform?.env?.SESSIONS) {
		return new Response('Service unavailable', { status: 503 });
	}

	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const error = url.searchParams.get('error');

	if (error) throw redirect(303, '/login?error=google_denied');
	if (!code || !state) throw redirect(303, '/login?error=google_invalid');

	const clientId = platform.env.GOOGLE_CLIENT_ID;
	const clientSecret = platform.env.GOOGLE_CLIENT_SECRET;
	const redirectUri = platform.env.GOOGLE_REDIRECT_URI;
	const jwtSecret = resolveJwtSecret(platform);

	if (!clientId || !clientSecret || !redirectUri) {
		throw redirect(303, '/login?error=google_not_configured');
	}

	const db = platform.env.DB;
	const kv = platform.env.SESSIONS;

	// Verify state (CSRF)
	const stateData = await kv.get(`google_state:${state}`);
	if (!stateData) throw redirect(303, '/login?error=google_invalid_state');
	await kv.delete(`google_state:${state}`);

	const { userId: linkingUserId } = JSON.parse(stateData) as { userId: string | null };

	// Exchange code for tokens
	let googleTokens;
	try {
		googleTokens = await exchangeGoogleCode(code, clientId, clientSecret, redirectUri);
	} catch {
		throw redirect(303, '/login?error=google_token_failed');
	}

	// Get Google profile
	let googleProfile;
	try {
		googleProfile = await getGoogleProfile(googleTokens.access_token);
	} catch {
		throw redirect(303, '/login?error=google_profile_failed');
	}

	const now = new Date().toISOString();

	// Check if Google account is already linked
	const existingLink = await db
		.prepare('SELECT id, user_id FROM google_accounts WHERE google_user_id = ?')
		.bind(googleProfile.id)
		.first<{ id: string; user_id: string }>();

	// Case 1: Linking to existing logged-in user
	if (linkingUserId) {
		if (existingLink) {
			if (existingLink.user_id === linkingUserId) {
				throw redirect(303, '/dashboard/settings?google=already_linked');
			}
			throw redirect(303, '/dashboard/settings?google=linked_other');
		}

		await db
			.prepare(
				`INSERT INTO google_accounts (id, user_id, google_user_id, email, display_name, picture_url, created_at, updated_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(generateId(), linkingUserId, googleProfile.id, googleProfile.email, googleProfile.name, googleProfile.picture || null, now, now)
			.run();

		await db
			.prepare(
				`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, ip_address, created_at)
				 VALUES (?, ?, 'google_linked', 'user', ?, ?, ?, ?)`
			)
			.bind(generateId(), linkingUserId, linkingUserId, `Google: ${googleProfile.email}`, getClientAddress(), now)
			.run();

		throw redirect(303, '/dashboard/settings?google=linked');
	}

	// Case 2: Login via Google (existing link)
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

		return issueTokensAndRedirect({ user, googleProfile, db, kv, cookies, jwtSecret, now, getClientAddress });
	}

	// Case 3: No existing link — check if email already exists in users table
	const existingUser = await db
		.prepare('SELECT id, email, display_name, kyc_level, status, email_verified, totp_enabled FROM users WHERE email = ?')
		.bind(googleProfile.email.toLowerCase())
		.first<{
			id: string;
			email: string;
			display_name: string | null;
			kyc_level: number;
			status: string;
			email_verified: number | null;
			totp_enabled: number | null;
		}>();

	if (existingUser) {
		// Link Google to existing account and log in
		await db
			.prepare(
				`INSERT INTO google_accounts (id, user_id, google_user_id, email, display_name, picture_url, created_at, updated_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(generateId(), existingUser.id, googleProfile.id, googleProfile.email, googleProfile.name, googleProfile.picture || null, now, now)
			.run();

		return issueTokensAndRedirect({ user: existingUser, googleProfile, db, kv, cookies, jwtSecret, now, getClientAddress });
	}

	// Case 4: Brand new user — auto-create account
	const userId = generateId();
	await db
		.prepare(
			`INSERT INTO users (id, email, password_hash, display_name, kyc_level, status, failed_login_attempts, email_verified, totp_enabled, created_at, updated_at)
			 VALUES (?, ?, '', ?, 0, 'active', 0, 1, 0, ?, ?)`
		)
		.bind(userId, googleProfile.email.toLowerCase(), googleProfile.name || null, now, now)
		.run();

	await db
		.prepare(
			`INSERT INTO google_accounts (id, user_id, google_user_id, email, display_name, picture_url, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(generateId(), userId, googleProfile.id, googleProfile.email, googleProfile.name, googleProfile.picture || null, now, now)
		.run();

	const newUser = {
		id: userId,
		email: googleProfile.email.toLowerCase(),
		display_name: googleProfile.name || null,
		kyc_level: 0,
		status: 'active',
		email_verified: 1,
		totp_enabled: 0
	};

	await db
		.prepare(
			`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, ip_address, created_at)
			 VALUES (?, ?, 'register_google', 'user', ?, ?, ?)`
		)
		.bind(generateId(), userId, userId, getClientAddress(), now)
		.run();

	return issueTokensAndRedirect({ user: newUser, googleProfile, db, kv, cookies, jwtSecret, now, getClientAddress });
};

async function issueTokensAndRedirect({
	user,
	googleProfile,
	db,
	kv,
	cookies,
	jwtSecret,
	now,
	getClientAddress
}: {
	user: { id: string; email: string; display_name: string | null; kyc_level: number; status: string; email_verified: number | null; totp_enabled: number | null };
	googleProfile: { id: string; email: string; name: string };
	db: D1Database;
	kv: KVNamespace;
	cookies: import('@sveltejs/kit').Cookies;
	jwtSecret: string;
	now: string;
	getClientAddress: () => string;
}): Promise<never> {
	const emailVerified = !!(user.email_verified);
	const totpEnabled = !!(user.totp_enabled);

	if (totpEnabled) {
		const login2faToken = await createLogin2faToken({
			sub: user.id,
			email: user.email,
			displayName: user.display_name,
			kycLevel: user.kyc_level,
			emailVerified,
			totpEnabled
		}, jwtSecret);

		cookies.set('login2faToken', login2faToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			path: '/',
			maxAge: LOGIN_2FA_TOKEN_MAX_AGE
		});

		await db
			.prepare(
				`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, ip_address, created_at)
				 VALUES (?, ?, 'login_google_2fa_required', 'user', ?, ?, ?, ?)`
			)
			.bind(generateId(), user.id, user.id, `Google: ${googleProfile.email}`, getClientAddress(), now)
			.run();

		throw redirect(303, '/login?requires2fa=true');
	}

	const tokenPayload = {
		sub: user.id,
		email: user.email,
		displayName: user.display_name,
		kycLevel: user.kyc_level,
		emailVerified,
		totpEnabled
	};

	const accessToken = await createAccessToken(tokenPayload, jwtSecret);
	const refreshToken = await createRefreshToken(tokenPayload, jwtSecret);

	await kv.put(`session:${user.id}:${refreshToken.slice(-16)}`, JSON.stringify({
		userId: user.id,
		createdAt: now,
		ip: getClientAddress()
	}), { expirationTtl: REFRESH_TOKEN_MAX_AGE });

	await db
		.prepare(
			`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, ip_address, created_at)
			 VALUES (?, ?, 'login_google', 'user', ?, ?, ?, ?)`
		)
		.bind(generateId(), user.id, user.id, `Google: ${googleProfile.email}`, getClientAddress(), now)
		.run();

	cookies.set('accessToken', accessToken, {
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		path: '/',
		maxAge: ACCESS_TOKEN_MAX_AGE
	});
	cookies.set('refreshToken', refreshToken, {
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		path: '/api/v1/auth',
		maxAge: REFRESH_TOKEN_MAX_AGE
	});

	throw redirect(303, '/dashboard');
}
