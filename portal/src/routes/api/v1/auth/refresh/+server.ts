import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyToken, createAccessToken, createRefreshToken, generateId } from '$lib/server/auth';

const DEV_JWT_SECRET = 'tcex-dev-jwt-secret-do-not-use-in-production';

export const POST: RequestHandler = async ({ cookies, platform, getClientAddress }) => {
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	const db = platform.env.DB;
	const kv = platform.env.SESSIONS;
	const jwtSecret = platform.env.JWT_SECRET || DEV_JWT_SECRET;

	// Get refresh token from httpOnly cookie
	const refreshToken = cookies.get('refreshToken');
	if (!refreshToken) {
		return json(
			{ error: { code: 'NO_REFRESH_TOKEN', message: '請重新登入' } },
			{ status: 401 }
		);
	}

	// Verify the refresh token
	const payload = await verifyToken(refreshToken, jwtSecret);
	if (!payload || payload.type !== 'refresh') {
		const response = json(
			{ error: { code: 'INVALID_REFRESH_TOKEN', message: '請重新登入' } },
			{ status: 401 }
		);
		response.headers.set(
			'Set-Cookie',
			'refreshToken=; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=0'
		);
		return response;
	}

	// Verify session exists in KV (not revoked)
	const sessionKey = `session:${payload.sub}:${refreshToken.slice(-16)}`;
	const session = await kv.get(sessionKey);
	if (!session) {
		const response = json(
			{ error: { code: 'SESSION_REVOKED', message: '工作階段已失效，請重新登入' } },
			{ status: 401 }
		);
		response.headers.set(
			'Set-Cookie',
			'refreshToken=; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=0'
		);
		return response;
	}

	// Fetch current user data for fresh token payload
	const user = await db
		.prepare('SELECT id, email, display_name, kyc_level, status, email_verified, totp_enabled FROM users WHERE id = ?')
		.bind(payload.sub)
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
		await kv.delete(sessionKey);
		const response = json(
			{ error: { code: 'ACCOUNT_DISABLED', message: '帳戶已被停用' } },
			{ status: 403 }
		);
		response.headers.set(
			'Set-Cookie',
			'refreshToken=; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=0'
		);
		return response;
	}

	const emailVerified = !!(user.email_verified);
	const totpEnabled = !!(user.totp_enabled);

	// Rotate tokens
	const tokenPayload = {
		sub: user.id,
		email: user.email,
		displayName: user.display_name,
		kycLevel: user.kyc_level,
		emailVerified,
		totpEnabled
	};
	const newAccessToken = await createAccessToken(tokenPayload, jwtSecret);
	const newRefreshToken = await createRefreshToken(tokenPayload, jwtSecret);
	const now = new Date().toISOString();

	// Delete old session, create new one
	await kv.delete(sessionKey);
	await kv.put(`session:${user.id}:${newRefreshToken.slice(-16)}`, JSON.stringify({
		userId: user.id,
		createdAt: now,
		ip: getClientAddress()
	}), { expirationTtl: 7 * 24 * 60 * 60 });

	// Audit log
	await db
		.prepare(
			`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, ip_address, created_at)
			 VALUES (?, ?, 'token_refresh', 'user', ?, ?, ?)`
		)
		.bind(generateId(), user.id, user.id, getClientAddress(), now)
		.run();

	const response = json({
		user: {
			id: user.id,
			email: user.email,
			displayName: user.display_name,
			kycLevel: user.kyc_level,
			emailVerified,
			totpEnabled
		},
		accessToken: newAccessToken
	});

	response.headers.set(
		'Set-Cookie',
		`refreshToken=${newRefreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=${7 * 24 * 60 * 60}`
	);

	return response;
};
