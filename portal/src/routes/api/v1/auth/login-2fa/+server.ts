import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	verifyToken,
	generateId,
	createAccessToken,
	createRefreshToken,
	resolveJwtSecret,
	ACCESS_TOKEN_MAX_AGE,
	REFRESH_TOKEN_MAX_AGE
} from '$lib/server/auth';
import { require2fa } from '$lib/server/2fa-guard';

export const POST: RequestHandler = async ({ request, platform, cookies, getClientAddress }) => {
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	const db = platform.env.DB;
	const kv = platform.env.SESSIONS;
	const jwtSecret = resolveJwtSecret(platform);

	let body: { totpCode?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: { code: 'BAD_REQUEST', message: '無效的請求內容' } }, { status: 400 });
	}

	if (!body.totpCode) {
		return json({ error: { code: 'BAD_REQUEST', message: '請提供驗證碼' } }, { status: 400 });
	}

	// Read login_2fa token from httpOnly cookie (not from request body)
	const login2faToken = cookies.get('login2faToken');
	if (!login2faToken) {
		return json({ error: { code: 'NO_LOGIN_TOKEN', message: '登入令牌不存在或已過期，請重新登入' } }, { status: 401 });
	}

	// Verify the temporary login_2fa token
	const payload = await verifyToken(login2faToken, jwtSecret);
	if (!payload || payload.type !== 'login_2fa') {
		cookies.delete('login2faToken', { path: '/' });
		return json({ error: { code: 'INVALID_TOKEN', message: '令牌無效或已過期，請重新登入' } }, { status: 401 });
	}

	// Verify 2FA
	const tfaResult = await require2fa(db, payload.sub, body.totpCode);
	if (!tfaResult.ok) {
		return json({ error: { code: 'INVALID_2FA', message: tfaResult.message } }, { status: 403 });
	}

	// Clear the temporary login_2fa cookie
	cookies.delete('login2faToken', { path: '/' });

	// Issue full tokens
	const now = new Date().toISOString();
	const tokenPayload = {
		sub: payload.sub,
		email: payload.email,
		displayName: payload.displayName,
		kycLevel: payload.kycLevel,
		emailVerified: payload.emailVerified,
		totpEnabled: payload.totpEnabled
	};
	const accessToken = await createAccessToken(tokenPayload, jwtSecret);
	const refreshToken = await createRefreshToken(tokenPayload, jwtSecret);

	// Store session
	await kv.put(`session:${payload.sub}:${refreshToken.slice(-16)}`, JSON.stringify({
		userId: payload.sub,
		createdAt: now,
		ip: getClientAddress()
	}), { expirationTtl: REFRESH_TOKEN_MAX_AGE });

	// Audit log
	await db
		.prepare(
			`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, ip_address, created_at)
			 VALUES (?, ?, 'login_2fa_completed', 'user', ?, ?, ?)`
		)
		.bind(generateId(), payload.sub, payload.sub, getClientAddress(), now)
		.run();

	// Set auth cookies
	cookies.set('accessToken', accessToken, {
		httpOnly: true,
		secure: true,
		sameSite: 'strict',
		path: '/',
		maxAge: ACCESS_TOKEN_MAX_AGE
	});
	cookies.set('refreshToken', refreshToken, {
		httpOnly: true,
		secure: true,
		sameSite: 'strict',
		path: '/api/v1/auth',
		maxAge: REFRESH_TOKEN_MAX_AGE
	});

	return json({
		user: {
			id: payload.sub,
			email: payload.email,
			displayName: payload.displayName,
			kycLevel: payload.kycLevel,
			emailVerified: payload.emailVerified,
			totpEnabled: payload.totpEnabled
		}
	});
};
