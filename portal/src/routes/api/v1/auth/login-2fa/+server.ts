import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	verifyToken,
	generateId,
	createAccessToken,
	createRefreshToken
} from '$lib/server/auth';
import { require2fa } from '$lib/server/2fa-guard';

const DEV_JWT_SECRET = 'tcex-dev-jwt-secret-do-not-use-in-production';

export const POST: RequestHandler = async ({ request, platform, getClientAddress }) => {
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	const db = platform.env.DB;
	const kv = platform.env.SESSIONS;
	const jwtSecret = platform.env.JWT_SECRET || DEV_JWT_SECRET;

	let body: { loginToken?: string; totpCode?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: { code: 'BAD_REQUEST', message: '無效的請求內容' } }, { status: 400 });
	}

	if (!body.loginToken || !body.totpCode) {
		return json({ error: { code: 'BAD_REQUEST', message: '請提供登入令牌和驗證碼' } }, { status: 400 });
	}

	// Verify the temporary login_2fa token
	const payload = await verifyToken(body.loginToken, jwtSecret);
	if (!payload || payload.type !== 'login_2fa') {
		return json({ error: { code: 'INVALID_TOKEN', message: '令牌無效或已過期' } }, { status: 401 });
	}

	// Verify 2FA
	const tfaResult = await require2fa(db, payload.sub, body.totpCode);
	if (!tfaResult.ok) {
		return json({ error: { code: 'INVALID_2FA', message: tfaResult.message } }, { status: 403 });
	}

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
	}), { expirationTtl: 7 * 24 * 60 * 60 });

	// Audit log
	await db
		.prepare(
			`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, ip_address, created_at)
			 VALUES (?, ?, 'login_2fa_completed', 'user', ?, ?, ?)`
		)
		.bind(generateId(), payload.sub, payload.sub, getClientAddress(), now)
		.run();

	const response = json({
		user: {
			id: payload.sub,
			email: payload.email,
			displayName: payload.displayName,
			kycLevel: payload.kycLevel,
			emailVerified: payload.emailVerified,
			totpEnabled: payload.totpEnabled
		},
		accessToken
	});

	response.headers.set(
		'Set-Cookie',
		`refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=${7 * 24 * 60 * 60}`
	);

	return response;
};
