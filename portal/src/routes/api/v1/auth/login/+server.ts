import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	verifyPassword,
	generateId,
	createAccessToken,
	createRefreshToken
} from '$lib/server/auth';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export const POST: RequestHandler = async ({ request, platform, getClientAddress }) => {
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	const db = platform.env.DB;
	const kv = platform.env.SESSIONS;

	let body: { email?: string; password?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: { code: 'INVALID_REQUEST', message: '無效的請求格式' } }, { status: 400 });
	}

	const { email, password } = body;

	if (!email || !password) {
		return json(
			{ error: { code: 'MISSING_FIELDS', message: '請提供電子郵件和密碼' } },
			{ status: 400 }
		);
	}

	// Find user
	const user = await db
		.prepare(
			'SELECT id, email, password_hash, display_name, kyc_level, status, failed_login_attempts, locked_until FROM users WHERE email = ?'
		)
		.bind(email.toLowerCase())
		.first<{
			id: string;
			email: string;
			password_hash: string;
			display_name: string | null;
			kyc_level: number;
			status: string;
			failed_login_attempts: number;
			locked_until: string | null;
		}>();

	if (!user) {
		// Generic error to prevent email enumeration
		return json(
			{ error: { code: 'INVALID_CREDENTIALS', message: '電子郵件或密碼不正確' } },
			{ status: 401 }
		);
	}

	// Check account status
	if (user.status !== 'active') {
		return json(
			{ error: { code: 'ACCOUNT_DISABLED', message: '帳戶已被停用，請聯繫客服' } },
			{ status: 403 }
		);
	}

	// Check lockout
	if (user.locked_until) {
		const lockedUntil = new Date(user.locked_until);
		if (lockedUntil > new Date()) {
			return json(
				{ error: { code: 'ACCOUNT_LOCKED', message: '帳戶已鎖定，請在15分鐘後重試' } },
				{ status: 429 }
			);
		}
		// Lockout expired — reset
		await db
			.prepare('UPDATE users SET failed_login_attempts = 0, locked_until = NULL, updated_at = ? WHERE id = ?')
			.bind(new Date().toISOString(), user.id)
			.run();
		user.failed_login_attempts = 0;
		user.locked_until = null;
	}

	// Verify password
	const valid = await verifyPassword(password, user.password_hash);
	const now = new Date().toISOString();

	if (!valid) {
		const attempts = user.failed_login_attempts + 1;
		const remaining = MAX_FAILED_ATTEMPTS - attempts;

		if (attempts >= MAX_FAILED_ATTEMPTS) {
			// Lock the account
			const lockUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString();
			await db
				.prepare('UPDATE users SET failed_login_attempts = ?, locked_until = ?, updated_at = ? WHERE id = ?')
				.bind(attempts, lockUntil, now, user.id)
				.run();

			// Audit log
			await db
				.prepare(
					`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, ip_address, created_at)
					 VALUES (?, ?, 'account_locked', 'user', ?, ?, ?, ?)`
				)
				.bind(generateId(), user.id, user.id, `Locked after ${attempts} failed attempts`, getClientAddress(), now)
				.run();

			return json(
				{ error: { code: 'ACCOUNT_LOCKED', message: '帳戶已鎖定，請在15分鐘後重試' } },
				{ status: 429 }
			);
		}

		// Increment failed attempts
		await db
			.prepare('UPDATE users SET failed_login_attempts = ?, updated_at = ? WHERE id = ?')
			.bind(attempts, now, user.id)
			.run();

		return json(
			{
				error: {
					code: 'INVALID_CREDENTIALS',
					message: `電子郵件或密碼不正確（還剩 ${remaining} 次嘗試機會）`
				}
			},
			{ status: 401 }
		);
	}

	// Successful login — reset failed attempts
	await db
		.prepare('UPDATE users SET failed_login_attempts = 0, locked_until = NULL, updated_at = ? WHERE id = ?')
		.bind(now, user.id)
		.run();

	// Create tokens
	const tokenPayload = {
		sub: user.id,
		email: user.email,
		displayName: user.display_name,
		kycLevel: user.kyc_level
	};
	const accessToken = await createAccessToken(tokenPayload);
	const refreshToken = await createRefreshToken(tokenPayload);

	// Store session in KV
	await kv.put(`session:${user.id}:${refreshToken.slice(-16)}`, JSON.stringify({
		userId: user.id,
		createdAt: now,
		ip: getClientAddress()
	}), { expirationTtl: 7 * 24 * 60 * 60 });

	// Audit log
	await db
		.prepare(
			`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, ip_address, created_at)
			 VALUES (?, ?, 'login', 'user', ?, ?, ?)`
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
		accessToken
	});

	response.headers.set(
		'Set-Cookie',
		`refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=${7 * 24 * 60 * 60}`
	);

	return response;
};
