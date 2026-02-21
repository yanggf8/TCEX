import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateId } from '$lib/server/auth';
import { sendNotification, kycApprovedEmail, kycRejectedEmail } from '$lib/server/notifications';

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

	// Load application + user email for notification
	const app = await db
		.prepare(`SELECT ka.id, ka.user_id, ka.level, ka.status,
			u.email, u.display_name
			FROM kyc_applications ka JOIN users u ON u.id = ka.user_id
			WHERE ka.id = ?`)
		.bind(applicationId)
		.first<{ id: string; user_id: string; level: number; status: string; email: string; display_name: string | null }>();

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

	// Send notification email (non-blocking)
	if (body.action === 'approve') {
		sendNotification(
			platform.env.RESEND_API_KEY,
			app.email,
			'【TCEX】身份驗證 L2 審核通過',
			kycApprovedEmail(app.display_name)
		);
	} else {
		sendNotification(
			platform.env.RESEND_API_KEY,
			app.email,
			'【TCEX】身份驗證 L2 審核結果通知',
			kycRejectedEmail(app.display_name, body.notes!.trim())
		);
	}

	return json({ status: newStatus });
};
