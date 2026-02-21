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

	let body: { action?: string; notes?: string | null };
	try {
		body = await request.json();
	} catch {
		return json({ error: { code: 'BAD_REQUEST' } }, { status: 400 });
	}

	if (body.action !== 'approve' && body.action !== 'reject') {
		return json({ error: { code: 'INVALID_ACTION' } }, { status: 400 });
	}

	if (body.action === 'reject' && !body.notes?.trim()) {
		return json({ error: { code: 'REJECTION_REASON_REQUIRED' } }, { status: 400 });
	}

	const applicationId = params.id;
	const now = new Date().toISOString();

	// Load application
	const app = await db
		.prepare("SELECT id, user_id, level, status FROM kyc_applications WHERE id = ?")
		.bind(applicationId)
		.first<{ id: string; user_id: string; level: number; status: string }>();

	if (!app) {
		return json({ error: { code: 'NOT_FOUND' } }, { status: 404 });
	}

	if (app.status !== 'pending') {
		return json({ error: { code: 'ALREADY_REVIEWED' } }, { status: 409 });
	}

	const newStatus = body.action === 'approve' ? 'approved' : 'rejected';

	// Update application
	await db
		.prepare(`UPDATE kyc_applications
			SET status = ?, reviewer_notes = ?, reviewed_by = ?, reviewed_at = ?, updated_at = ?
			WHERE id = ?`)
		.bind(newStatus, body.notes?.trim() || null, locals.user.id, now, now, applicationId)
		.run();

	// If approved, upgrade user KYC level
	if (body.action === 'approve') {
		await db
			.prepare('UPDATE users SET kyc_level = ?, updated_at = ? WHERE id = ? AND kyc_level < ?')
			.bind(app.level, now, app.user_id, app.level)
			.run();
	}

	// Audit log
	await db
		.prepare(`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, ip_address, created_at)
			VALUES (?, ?, 'kyc_review', 'kyc', ?, ?, ?, ?)`)
		.bind(
			generateId(),
			locals.user.id,
			applicationId,
			`action=${body.action}, level=${app.level}, notes=${body.notes?.trim() || ''}`,
			getClientAddress(),
			now
		)
		.run();

	return json({ status: newStatus });
};
