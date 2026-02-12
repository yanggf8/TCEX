import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	verifyToken,
	createAccessToken,
	createRefreshToken,
	generateId,
	resolveJwtSecret,
	ACCESS_TOKEN_MAX_AGE,
	REFRESH_TOKEN_MAX_AGE
} from '$lib/server/auth';

export const POST: RequestHandler = async ({ cookies, platform, getClientAddress }) => {
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	const db = platform.env.DB;
	const kv = platform.env.SESSIONS;
	const jwtSecret = resolveJwtSecret(platform);

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
		cookies.delete('refreshToken', { path: '/api/v1/auth' });
		cookies.delete('accessToken', { path: '/' });
		return json(
			{ error: { code: 'INVALID_REFRESH_TOKEN', message: '請重新登入' } },
			{ status: 401 }
		);
	}

	// Verify session exists in KV (not revoked)
	const sessionKey = `session:${payload.sub}:${refreshToken.slice(-16)}`;
	const session = await kv.get(sessionKey);
	if (!session) {
		cookies.delete('refreshToken', { path: '/api/v1/auth' });
		cookies.delete('accessToken', { path: '/' });
		return json(
			{ error: { code: 'SESSION_REVOKED', message: '工作階段已失效，請重新登入' } },
			{ status: 401 }
		);
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
		cookies.delete('refreshToken', { path: '/api/v1/auth' });
		cookies.delete('accessToken', { path: '/' });
		return json(
			{ error: { code: 'ACCOUNT_DISABLED', message: '帳戶已被停用' } },
			{ status: 403 }
		);
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
	}), { expirationTtl: REFRESH_TOKEN_MAX_AGE });

	// Audit log
	await db
		.prepare(
			`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, ip_address, created_at)
			 VALUES (?, ?, 'token_refresh', 'user', ?, ?, ?)`
		)
		.bind(generateId(), user.id, user.id, getClientAddress(), now)
		.run();

	// Set rotated auth cookies
	cookies.set('accessToken', newAccessToken, {
		httpOnly: true,
		secure: true,
		sameSite: 'strict',
		path: '/',
		maxAge: ACCESS_TOKEN_MAX_AGE
	});
	cookies.set('refreshToken', newRefreshToken, {
		httpOnly: true,
		secure: true,
		sameSite: 'strict',
		path: '/api/v1/auth',
		maxAge: REFRESH_TOKEN_MAX_AGE
	});

	return json({
		user: {
			id: user.id,
			email: user.email,
			displayName: user.display_name,
			kycLevel: user.kyc_level,
			emailVerified,
			totpEnabled
		}
	});
};
