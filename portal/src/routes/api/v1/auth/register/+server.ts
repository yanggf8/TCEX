import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	hashPassword,
	generateId,
	validateEmail,
	validatePassword,
	createAccessToken,
	createRefreshToken
} from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, platform, getClientAddress }) => {
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	const db = platform.env.DB;
	const kv = platform.env.SESSIONS;

	let body: { email?: string; password?: string; displayName?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: { code: 'INVALID_REQUEST', message: '無效的請求格式' } }, { status: 400 });
	}

	const { email, password, displayName } = body;

	// Validate email
	if (!email || !validateEmail(email)) {
		return json(
			{ error: { code: 'INVALID_EMAIL', message: '請提供有效的電子郵件地址' } },
			{ status: 400 }
		);
	}

	// Validate password
	if (!password) {
		return json(
			{ error: { code: 'INVALID_PASSWORD', message: '請提供密碼' } },
			{ status: 400 }
		);
	}
	const passwordError = validatePassword(password);
	if (passwordError) {
		return json(
			{ error: { code: 'WEAK_PASSWORD', message: passwordError } },
			{ status: 400 }
		);
	}

	// Check if email already exists
	const existing = await db
		.prepare('SELECT id FROM users WHERE email = ?')
		.bind(email.toLowerCase())
		.first();
	if (existing) {
		return json(
			{ error: { code: 'EMAIL_EXISTS', message: '此電子郵件已被註冊' } },
			{ status: 409 }
		);
	}

	// Create user
	const userId = generateId();
	const passwordHash = await hashPassword(password);
	const now = new Date().toISOString();

	await db
		.prepare(
			`INSERT INTO users (id, email, password_hash, display_name, kyc_level, status, failed_login_attempts, created_at, updated_at)
			 VALUES (?, ?, ?, ?, 0, 'active', 0, ?, ?)`
		)
		.bind(userId, email.toLowerCase(), passwordHash, displayName || null, now, now)
		.run();

	// Create tokens
	const tokenPayload = {
		sub: userId,
		email: email.toLowerCase(),
		displayName: displayName || null,
		kycLevel: 0
	};
	const accessToken = await createAccessToken(tokenPayload);
	const refreshToken = await createRefreshToken(tokenPayload);

	// Store refresh token in KV (for session tracking / revocation)
	await kv.put(`session:${userId}:${refreshToken.slice(-16)}`, JSON.stringify({
		userId,
		createdAt: now,
		ip: getClientAddress()
	}), { expirationTtl: 7 * 24 * 60 * 60 }); // 7 days

	// Audit log
	await db
		.prepare(
			`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, ip_address, created_at)
			 VALUES (?, ?, 'register', 'user', ?, ?, ?)`
		)
		.bind(generateId(), userId, userId, getClientAddress(), now)
		.run();

	// Return tokens — refresh token as httpOnly cookie
	const response = json(
		{
			user: {
				id: userId,
				email: email.toLowerCase(),
				displayName: displayName || null,
				kycLevel: 0
			},
			accessToken
		},
		{ status: 201 }
	);

	response.headers.set(
		'Set-Cookie',
		`refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=${7 * 24 * 60 * 60}`
	);

	return response;
};
