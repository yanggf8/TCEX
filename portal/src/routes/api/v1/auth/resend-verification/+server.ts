import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateId } from '$lib/server/auth';
import { generateOtp, createEmailSender } from '$lib/server/email';
import { checkRateLimit } from '$lib/server/rate-limit';

export const POST: RequestHandler = async ({ locals, platform, getClientAddress }) => {
	if (!locals.user) {
		return json({ error: { code: 'UNAUTHORIZED', message: '請先登入' } }, { status: 401 });
	}
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	const db = platform.env.DB;
	const kv = platform.env.SESSIONS;

	// Rate limit: 1 per 60 seconds
	const rateLimitOk = await checkRateLimit(kv, `email_otp:${locals.user.id}`, 60);
	if (!rateLimitOk) {
		return json({ error: { code: 'RATE_LIMITED', message: '請稍後再試（60秒內只能發送一次）' } }, { status: 429 });
	}

	// Check if already verified
	const user = await db
		.prepare('SELECT email, email_verified FROM users WHERE id = ?')
		.bind(locals.user.id)
		.first<{ email: string; email_verified: number | null }>();

	if (!user) {
		return json({ error: { code: 'NOT_FOUND', message: '用戶不存在' } }, { status: 404 });
	}

	if (user.email_verified) {
		return json({ error: { code: 'ALREADY_VERIFIED', message: '電子郵件已驗證' } }, { status: 400 });
	}

	// Generate new OTP
	const otp = generateOtp();
	const now = new Date().toISOString();
	const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

	await db
		.prepare(
			`INSERT INTO email_verifications (id, user_id, code, expires_at, created_at)
			 VALUES (?, ?, ?, ?, ?)`
		)
		.bind(generateId(), locals.user.id, otp, otpExpiry, now)
		.run();

	// Send verification email
	const emailSender = createEmailSender(platform.env.RESEND_API_KEY);
	await emailSender.send(
		user.email,
		'【TCEX】Email 驗證碼（重新發送）',
		`<p>您的驗證碼為：<strong style="font-size:24px;letter-spacing:4px">${otp}</strong></p><p>驗證碼將於 10 分鐘後失效，請勿將此碼告知他人。</p>`
	);

	// Audit log
	await db
		.prepare(
			`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, ip_address, created_at)
			 VALUES (?, ?, 'resend_verification', 'user', ?, ?, ?)`
		)
		.bind(generateId(), locals.user.id, locals.user.id, getClientAddress(), now)
		.run();

	return json({ success: true });
};
