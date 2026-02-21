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

	const googleAccount = await db
		.prepare('SELECT id, google_user_id FROM google_accounts WHERE user_id = ?')
		.bind(locals.user.id)
		.first<{ id: string; google_user_id: string }>();

	if (!googleAccount) {
		return json({ error: { code: 'NOT_LINKED', message: 'Google 帳號未連結' } }, { status: 400 });
	}

	await db.prepare('DELETE FROM google_accounts WHERE id = ?').bind(googleAccount.id).run();

	await db
		.prepare(
			`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, ip_address, created_at)
			 VALUES (?, ?, 'google_unlinked', 'user', ?, ?, ?, ?)`
		)
		.bind(generateId(), locals.user.id, locals.user.id, `Google ID: ${googleAccount.google_user_id}`, getClientAddress(), now)
		.run();

	return json({ success: true });
};
