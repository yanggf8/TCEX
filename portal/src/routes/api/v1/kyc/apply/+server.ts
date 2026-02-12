import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateId } from '$lib/server/auth';
import { canAutoApprove } from '$lib/server/kyc-rules';

export const POST: RequestHandler = async ({ request, locals, platform, getClientAddress }) => {
	if (!locals.user) {
		return json({ error: { code: 'UNAUTHORIZED', message: '請先登入' } }, { status: 401 });
	}
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	let body: {
		level?: number;
		fullName?: string;
		dateOfBirth?: string;
		nationalId?: string;
		address?: string;
	};
	try {
		body = await request.json();
	} catch {
		return json({ error: { code: 'BAD_REQUEST', message: '無效的請求內容' } }, { status: 400 });
	}

	if (!body.level || body.level < 1 || body.level > 3) {
		return json({ error: { code: 'BAD_REQUEST', message: '無效的驗證等級' } }, { status: 400 });
	}

	const db = platform.env.DB;
	const now = new Date().toISOString();

	// Get current user state
	const user = await db
		.prepare('SELECT kyc_level, email_verified, phone_verified FROM users WHERE id = ?')
		.bind(locals.user.id)
		.first<{ kyc_level: number; email_verified: number | null; phone_verified: number | null }>();

	if (!user) {
		return json({ error: { code: 'NOT_FOUND', message: '用戶不存在' } }, { status: 404 });
	}

	// Check if already at or above requested level
	if (user.kyc_level >= body.level) {
		return json({ error: { code: 'ALREADY_VERIFIED', message: '已達到或超過此驗證等級' } }, { status: 400 });
	}

	// L1 prerequisites: email + phone verified
	if (body.level === 1) {
		if (!user.email_verified) {
			return json({ error: { code: 'EMAIL_NOT_VERIFIED', message: '請先驗證電子郵件' } }, { status: 400 });
		}
		if (!user.phone_verified) {
			return json({ error: { code: 'PHONE_NOT_VERIFIED', message: '請先驗證手機號碼' } }, { status: 400 });
		}
	}

	// L2 prerequisites: L1 + personal info
	if (body.level === 2) {
		if (user.kyc_level < 1) {
			return json({ error: { code: 'LEVEL_TOO_LOW', message: '請先完成 L1 驗證' } }, { status: 400 });
		}
		if (!body.fullName || !body.dateOfBirth || !body.nationalId || !body.address) {
			return json({ error: { code: 'MISSING_INFO', message: '請填寫完整個人資料' } }, { status: 400 });
		}
		// Save personal info
		await db
			.prepare('UPDATE users SET full_name = ?, date_of_birth = ?, national_id = ?, address = ?, updated_at = ? WHERE id = ?')
			.bind(body.fullName, body.dateOfBirth, body.nationalId, body.address, now, locals.user.id)
			.run();
	}

	// Check for existing pending application
	const existingApp = await db
		.prepare("SELECT id FROM kyc_applications WHERE user_id = ? AND status = 'pending'")
		.bind(locals.user.id)
		.first<{ id: string }>();

	if (existingApp) {
		return json({ error: { code: 'APPLICATION_PENDING', message: '已有審核中的申請' } }, { status: 400 });
	}

	const applicationId = generateId();
	const autoApprove = canAutoApprove(body.level);
	const status = autoApprove ? 'approved' : 'pending';

	await db
		.prepare(
			`INSERT INTO kyc_applications (id, user_id, level, status, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?)`
		)
		.bind(applicationId, locals.user.id, body.level, status, now, now)
		.run();

	// Auto-approve L1
	if (autoApprove) {
		await db
			.prepare('UPDATE users SET kyc_level = ?, updated_at = ? WHERE id = ?')
			.bind(body.level, now, locals.user.id)
			.run();
	}

	// Audit log
	await db
		.prepare(
			`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, ip_address, created_at)
			 VALUES (?, ?, 'kyc_application', 'kyc', ?, ?, ?, ?)`
		)
		.bind(generateId(), locals.user.id, applicationId, `Level ${body.level}, status: ${status}`, getClientAddress(), now)
		.run();

	return json({
		applicationId,
		level: body.level,
		status,
		autoApproved: autoApprove
	}, { status: 201 });
};
