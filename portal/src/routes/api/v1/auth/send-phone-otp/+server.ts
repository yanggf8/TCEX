import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateId } from '$lib/server/auth';
import { generateOtp } from '$lib/server/email';
import { checkRateLimit } from '$lib/server/rate-limit';

export const POST: RequestHandler = async ({ request, locals, platform, getClientAddress }) => {
	if (!locals.user) {
		return json({ error: { code: 'UNAUTHORIZED', message: '請先登入' } }, { status: 401 });
	}
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	let body: { phone?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: { code: 'BAD_REQUEST', message: '無效的請求內容' } }, { status: 400 });
	}

	if (!body.phone || !/^09\d{8}$/.test(body.phone)) {
		return json({ error: { code: 'INVALID_PHONE', message: '請提供有效的手機號碼（09xxxxxxxx）' } }, { status: 400 });
	}

	const db = platform.env.DB;
	const kv = platform.env.SESSIONS;

	// Rate limit: 1 per 60 seconds
	const rateLimitOk = await checkRateLimit(kv, `phone_otp:${locals.user.id}`, 60);
	if (!rateLimitOk) {
		return json({ error: { code: 'RATE_LIMITED', message: '請稍後再試（60秒內只能發送一次）' } }, { status: 429 });
	}

	const otp = generateOtp();
	const now = new Date().toISOString();
	const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

	await db
		.prepare(
			`INSERT INTO phone_verifications (id, user_id, phone, code, expires_at, created_at)
			 VALUES (?, ?, ?, ?, ?, ?)`
		)
		.bind(generateId(), locals.user.id, body.phone, otp, otpExpiry, now)
		.run();

	// Send SMS (console in dev)
	console.log(`[SMS] Verification code for ${body.phone}: ${otp}`);

	// Audit log
	await db
		.prepare(
			`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, ip_address, created_at)
			 VALUES (?, ?, 'phone_otp_sent', 'user', ?, ?, ?, ?)`
		)
		.bind(generateId(), locals.user.id, locals.user.id, `Phone: ${body.phone}`, getClientAddress(), now)
		.run();

	return json({ success: true });
};
