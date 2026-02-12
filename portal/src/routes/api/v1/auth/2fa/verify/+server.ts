import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateId } from '$lib/server/auth';
import { verifyTotpCode } from '$lib/server/totp';

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

	// Get pending TOTP secret
	const totpRow = await db
		.prepare('SELECT id, secret, backup_codes, enabled FROM totp_secrets WHERE user_id = ?')
		.bind(locals.user.id)
		.first<{ id: string; secret: string; backup_codes: string; enabled: number }>();

	if (!totpRow) {
		return json({ error: { code: 'NOT_FOUND', message: '請先設定兩步驟驗證' } }, { status: 400 });
	}

	if (totpRow.enabled) {
		return json({ error: { code: 'ALREADY_ENABLED', message: '兩步驟驗證已啟用' } }, { status: 400 });
	}

	// Verify the code
	if (!verifyTotpCode(totpRow.secret, body.code)) {
		return json({ error: { code: 'INVALID_CODE', message: '驗證碼不正確' } }, { status: 400 });
	}

	// Enable 2FA
	await db.batch([
		db.prepare('UPDATE totp_secrets SET enabled = 1, updated_at = ? WHERE id = ?').bind(now, totpRow.id),
		db.prepare('UPDATE users SET totp_enabled = 1, updated_at = ? WHERE id = ?').bind(now, locals.user.id)
	]);

	// Audit log
	await db
		.prepare(
			`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, ip_address, created_at)
			 VALUES (?, ?, '2fa_enabled', 'user', ?, ?, ?)`
		)
		.bind(generateId(), locals.user.id, locals.user.id, getClientAddress(), now)
		.run();

	const backupCodes: string[] = JSON.parse(totpRow.backup_codes);
	return json({ success: true, backupCodes });
};
