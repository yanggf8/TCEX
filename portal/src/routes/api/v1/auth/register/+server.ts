import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	hashPassword,
	generateId,
	validateEmail,
	validatePassword,
	createAccessToken,
	createRefreshToken,
	resolveJwtSecret,
	ACCESS_TOKEN_MAX_AGE,
	REFRESH_TOKEN_MAX_AGE
} from '$lib/server/auth';
import { generateOtp } from '$lib/server/email';

export const POST: RequestHandler = async ({ request, platform, cookies, getClientAddress }) => {
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	const db = platform.env.DB;
	const kv = platform.env.SESSIONS;
	const jwtSecret = resolveJwtSecret(platform);

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
			`INSERT INTO users (id, email, password_hash, display_name, kyc_level, status, failed_login_attempts, email_verified, totp_enabled, created_at, updated_at)
			 VALUES (?, ?, ?, ?, 0, 'active', 0, 0, 0, ?, ?)`
		)
		.bind(userId, email.toLowerCase(), passwordHash, displayName || null, now, now)
		.run();

	// Generate email verification OTP
	const otp = generateOtp();
	const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

	await db
		.prepare(
			`INSERT INTO email_verifications (id, user_id, code, expires_at, created_at)
			 VALUES (?, ?, ?, ?, ?)`
		)
		.bind(generateId(), userId, otp, otpExpiry, now)
		.run();

	// Send verification email (console in dev)
	console.log(`[EMAIL] Verification code for ${email.toLowerCase()}: ${otp}`);

	// Create tokens
	const tokenPayload = {
		sub: userId,
		email: email.toLowerCase(),
		displayName: displayName || null,
		kycLevel: 0,
		emailVerified: false,
		totpEnabled: false
	};
	const accessToken = await createAccessToken(tokenPayload, jwtSecret);
	const refreshToken = await createRefreshToken(tokenPayload, jwtSecret);

	// Store refresh token in KV
	await kv.put(`session:${userId}:${refreshToken.slice(-16)}`, JSON.stringify({
		userId,
		createdAt: now,
		ip: getClientAddress()
	}), { expirationTtl: REFRESH_TOKEN_MAX_AGE });

	// Audit log
	await db
		.prepare(
			`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, ip_address, created_at)
			 VALUES (?, ?, 'register', 'user', ?, ?, ?)`
		)
		.bind(generateId(), userId, userId, getClientAddress(), now)
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

	return json(
		{
			user: {
				id: userId,
				email: email.toLowerCase(),
				displayName: displayName || null,
				kycLevel: 0,
				emailVerified: false,
				totpEnabled: false
			}
		},
		{ status: 201 }
	);
};
