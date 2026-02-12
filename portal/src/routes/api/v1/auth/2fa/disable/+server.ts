import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateId, verifyPassword } from '$lib/server/auth';
import { verifyTotpCode } from '$lib/server/totp';

export const POST: RequestHandler = async ({ request, locals, platform, getClientAddress }) => {
	if (!locals.user) {
		return json({ error: { code: 'UNAUTHORIZED', message: '請先登入' } }, { status: 401 });
	}
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	let body: { password?: string; totpCode?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: { code: 'BAD_REQUEST', message: '無效的請求內容' } }, { status: 400 });
	}

	if (!body.password || !body.totpCode) {
		return json({ error: { code: 'BAD_REQUEST', message: '請提供密碼和驗證碼' } }, { status: 400 });
	}

	const db = platform.env.DB;
	const now = new Date().toISOString();

	// Verify password
	const user = await db
		.prepare('SELECT password_hash FROM users WHERE id = ?')
		.bind(locals.user.id)
		.first<{ password_hash: string }>();

	if (!user) {
		return json({ error: { code: 'NOT_FOUND', message: '用戶不存在' } }, { status: 404 });
	}

	const isValid = await verifyPassword(body.password, user.password_hash);
	if (!isValid) {
		return json({ error: { code: 'INVALID_PASSWORD', message: '密碼不正確' } }, { status: 400 });
	}

	// Verify TOTP code
	const totpRow = await db
		.prepare('SELECT id, secret, enabled FROM totp_secrets WHERE user_id = ?')
		.bind(locals.user.id)
		.first<{ id: string; secret: string; enabled: number }>();

	if (!totpRow || !totpRow.enabled) {
		return json({ error: { code: 'NOT_ENABLED', message: '兩步驟驗證未啟用' } }, { status: 400 });
	}

	if (!verifyTotpCode(totpRow.secret, body.totpCode)) {
		return json({ error: { code: 'INVALID_CODE', message: '驗證碼不正確' } }, { status: 400 });
	}

	// Disable 2FA
	await db.batch([
		db.prepare('DELETE FROM totp_secrets WHERE id = ?').bind(totpRow.id),
		db.prepare('UPDATE users SET totp_enabled = 0, updated_at = ? WHERE id = ?').bind(now, locals.user.id)
	]);

	// Audit log
	await db
		.prepare(
			`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, ip_address, created_at)
			 VALUES (?, ?, '2fa_disabled', 'user', ?, ?, ?)`
		)
		.bind(generateId(), locals.user.id, locals.user.id, getClientAddress(), now)
		.run();

	return json({ success: true });
};
