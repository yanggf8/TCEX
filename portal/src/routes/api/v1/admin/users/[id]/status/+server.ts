import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateId } from '$lib/server/auth';

export const POST: RequestHandler = async ({ params, request, locals, platform, getClientAddress }) => {
	if (!locals.user) {
		return json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
	}
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE' } }, { status: 503 });
	}

	const db = platform.env.DB;

	// Verify admin role from DB
	const adminUser = await db
		.prepare('SELECT role FROM users WHERE id = ?')
		.bind(locals.user.id)
		.first<{ role: string }>();

	if (!adminUser || adminUser.role !== 'admin') {
		return json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
	}

	let body: { action?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: { code: 'BAD_REQUEST' } }, { status: 400 });
	}

	if (body.action !== 'freeze' && body.action !== 'unfreeze') {
		return json({ error: { code: 'INVALID_ACTION' } }, { status: 400 });
	}

	const targetUserId = params.id;
	const now = new Date().toISOString();

	// Load target user
	const targetUser = await db
		.prepare('SELECT id, status, role FROM users WHERE id = ?')
		.bind(targetUserId)
		.first<{ id: string; status: string; role: string }>();

	if (!targetUser) {
		return json({ error: { code: 'NOT_FOUND' } }, { status: 404 });
	}

	// Prevent freezing other admins
	if (targetUser.role === 'admin') {
		return json({ error: { code: 'CANNOT_MODIFY_ADMIN' } }, { status: 403 });
	}

	const newStatus = body.action === 'freeze' ? 'frozen' : 'active';

	if (targetUser.status === newStatus) {
		return json({ error: { code: 'STATUS_UNCHANGED' } }, { status: 409 });
	}

	await db
		.prepare('UPDATE users SET status = ?, updated_at = ? WHERE id = ?')
		.bind(newStatus, now, targetUserId)
		.run();

	// Audit log
	await db
		.prepare(`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, ip_address, created_at)
			VALUES (?, ?, 'user_status_change', 'user', ?, ?, ?, ?)`)
		.bind(
			generateId(),
			locals.user.id,
			targetUserId,
			`action=${body.action}, new_status=${newStatus}`,
			getClientAddress(),
			now
		)
		.run();

	return json({ status: newStatus });
};
