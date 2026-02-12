import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateId } from '$lib/server/auth';

export const POST: RequestHandler = async ({ locals, platform, getClientAddress }) => {
	if (!locals.user) {
		return json({ error: { code: 'UNAUTHORIZED', message: '請先登入' } }, { status: 401 });
	}
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	const db = platform.env.DB;
	const now = new Date().toISOString();

	const lineAccount = await db
		.prepare('SELECT id, line_user_id FROM line_accounts WHERE user_id = ?')
		.bind(locals.user.id)
		.first<{ id: string; line_user_id: string }>();

	if (!lineAccount) {
		return json({ error: { code: 'NOT_LINKED', message: 'LINE 帳號未連結' } }, { status: 400 });
	}

	await db
		.prepare('DELETE FROM line_accounts WHERE id = ?')
		.bind(lineAccount.id)
		.run();

	// Audit log
	await db
		.prepare(
			`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, ip_address, created_at)
			 VALUES (?, ?, 'line_unlinked', 'user', ?, ?, ?, ?)`
		)
		.bind(generateId(), locals.user.id, locals.user.id, `LINE ID: ${lineAccount.line_user_id}`, getClientAddress(), now)
		.run();

	return json({ success: true });
};
