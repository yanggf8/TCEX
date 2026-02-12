import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateId } from '$lib/server/auth';
import { generateTotpSecret, generateBackupCodes } from '$lib/server/totp';

export const POST: RequestHandler = async ({ locals, platform, getClientAddress }) => {
	if (!locals.user) {
		return json({ error: { code: 'UNAUTHORIZED', message: '請先登入' } }, { status: 401 });
	}
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	const db = platform.env.DB;
	const now = new Date().toISOString();

	// Check if already has a secret (enabled or pending)
	const existing = await db
		.prepare('SELECT id, enabled FROM totp_secrets WHERE user_id = ?')
		.bind(locals.user.id)
		.first<{ id: string; enabled: number }>();

	if (existing?.enabled) {
		return json({ error: { code: 'ALREADY_ENABLED', message: '兩步驟驗證已啟用' } }, { status: 400 });
	}

	// Generate secret and backup codes
	const { secret, uri } = generateTotpSecret(locals.user.email);
	const backupCodes = generateBackupCodes(10);

	if (existing) {
		// Replace pending setup
		await db
			.prepare('UPDATE totp_secrets SET secret = ?, backup_codes = ?, enabled = 0, updated_at = ? WHERE id = ?')
			.bind(secret, JSON.stringify(backupCodes), now, existing.id)
			.run();
	} else {
		await db
			.prepare(
				`INSERT INTO totp_secrets (id, user_id, secret, backup_codes, enabled, created_at, updated_at)
				 VALUES (?, ?, ?, ?, 0, ?, ?)`
			)
			.bind(generateId(), locals.user.id, secret, JSON.stringify(backupCodes), now, now)
			.run();
	}

	// Audit log
	await db
		.prepare(
			`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, ip_address, created_at)
			 VALUES (?, ?, '2fa_setup_initiated', 'user', ?, ?, ?)`
		)
		.bind(generateId(), locals.user.id, locals.user.id, getClientAddress(), now)
		.run();

	return json({ uri, backupCodes });
};
