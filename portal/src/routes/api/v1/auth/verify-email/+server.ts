import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateId } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, locals, platform, getClientAddress }) => {
	if (!locals.user) {
		return json({ error: { code: 'UNAUTHORIZED', message: '請先登入' } }, { status: 401 });
	}
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	let body: { code?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: { code: 'BAD_REQUEST', message: '無效的請求內容' } }, { status: 400 });
	}

	if (!body.code || body.code.length !== 6) {
		return json({ error: { code: 'BAD_REQUEST', message: '請輸入6位數驗證碼' } }, { status: 400 });
	}

	const db = platform.env.DB;
	const now = new Date().toISOString();

	// Find valid verification code
	const verification = await db
		.prepare(
			`SELECT id, expires_at FROM email_verifications
			 WHERE user_id = ? AND code = ? AND used = 0
			 ORDER BY created_at DESC LIMIT 1`
		)
		.bind(locals.user.id, body.code)
		.first<{ id: string; expires_at: string }>();

	if (!verification) {
		return json({ error: { code: 'INVALID_CODE', message: '驗證碼不正確' } }, { status: 400 });
	}

	if (new Date(verification.expires_at) < new Date()) {
		return json({ error: { code: 'CODE_EXPIRED', message: '驗證碼已過期，請重新發送' } }, { status: 400 });
	}

	// Mark code as used and user as verified
	await db.batch([
		db.prepare('UPDATE email_verifications SET used = 1 WHERE id = ?').bind(verification.id),
		db.prepare('UPDATE users SET email_verified = 1, updated_at = ? WHERE id = ?').bind(now, locals.user.id)
	]);

	// Audit log
	await db
		.prepare(
			`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, ip_address, created_at)
			 VALUES (?, ?, 'email_verified', 'user', ?, ?, ?)`
		)
		.bind(generateId(), locals.user.id, locals.user.id, getClientAddress(), now)
		.run();

	return json({ success: true });
};
