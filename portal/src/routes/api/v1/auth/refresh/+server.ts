import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyToken, createAccessToken, createRefreshToken, generateId } from '$lib/server/auth';

export const POST: RequestHandler = async ({ cookies, platform, getClientAddress }) => {
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	const db = platform.env.DB;
	const kv = platform.env.SESSIONS;

	// Get refresh token from httpOnly cookie
	const refreshToken = cookies.get('refreshToken');
	if (!refreshToken) {
		return json(
			{ error: { code: 'NO_REFRESH_TOKEN', message: '請重新登入' } },
			{ status: 401 }
		);
	}

	// Verify the refresh token
	const payload = await verifyToken(refreshToken);
	if (!payload || payload.type !== 'refresh') {
		// Clear invalid cookie
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
		.prepare('SELECT id, email, display_name, kyc_level, status FROM users WHERE id = ?')
		.bind(payload.sub)
		.first<{
			id: string;
			email: string;
			display_name: string | null;
			kyc_level: number;
			status: string;
		}>();

	if (!user || user.status !== 'active') {
		// Delete session and clear cookie
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

	// Rotate tokens (issue new access + refresh)
	const tokenPayload = {
		sub: user.id,
		email: user.email,
		displayName: user.display_name,
		kycLevel: user.kyc_level
	};
	const newAccessToken = await createAccessToken(tokenPayload);
	const newRefreshToken = await createRefreshToken(tokenPayload);
	const now = new Date().toISOString();

	// Delete old session, create new one (token rotation)
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
			kycLevel: user.kyc_level
		},
		accessToken: newAccessToken
	});

	response.headers.set(
		'Set-Cookie',
		`refreshToken=${newRefreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=${7 * 24 * 60 * 60}`
	);

	return response;
};
