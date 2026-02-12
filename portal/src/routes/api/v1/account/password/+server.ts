import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { hashPassword, verifyPassword, validatePassword, generateId } from '$lib/server/auth';

export const PUT: RequestHandler = async ({ request, locals, platform, getClientAddress }) => {
	if (!locals.user) {
		return json({ error: { code: 'UNAUTHORIZED', message: '請先登入' } }, { status: 401 });
	}
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	let body: { currentPassword?: string; newPassword?: string; totpCode?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: { code: 'BAD_REQUEST', message: '無效的請求內容' } }, { status: 400 });
	}

	if (!body.currentPassword || !body.newPassword) {
		return json({ error: { code: 'BAD_REQUEST', message: '請填寫所有欄位' } }, { status: 400 });
	}

	// Validate new password strength
	const passwordError = validatePassword(body.newPassword);
	if (passwordError) {
		return json({ error: { code: 'WEAK_PASSWORD', message: passwordError } }, { status: 400 });
	}

	const db = platform.env.DB;

	// Verify current password using PBKDF2
	const user = await db
		.prepare('SELECT password_hash, totp_enabled FROM users WHERE id = ?')
		.bind(locals.user.id)
		.first<{ password_hash: string; totp_enabled: number | null }>();

	if (!user) {
		return json({ error: { code: 'NOT_FOUND', message: '用戶不存在' } }, { status: 404 });
	}

	const isValid = await verifyPassword(body.currentPassword, user.password_hash);
	if (!isValid) {
		return json({ error: { code: 'VALIDATION_ERROR', message: '目前密碼不正確' } }, { status: 400 });
	}

	// 2FA check if enabled
	if (user.totp_enabled) {
		const { require2fa } = await import('$lib/server/2fa-guard');
		const tfaResult = await require2fa(db, locals.user.id, body.totpCode);
		if (!tfaResult.ok) {
			return json({ error: { code: 'TOTP_REQUIRED', message: tfaResult.message } }, { status: 403 });
		}
	}

	// Update password with PBKDF2
	const newHash = await hashPassword(body.newPassword);
	const timestamp = new Date().toISOString();

	await db
		.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
		.bind(newHash, timestamp, locals.user.id)
		.run();

	// Audit log
	await db
		.prepare(
			`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, ip_address, created_at)
			 VALUES (?, ?, 'password_changed', 'user', ?, ?, ?)`
		)
		.bind(generateId(), locals.user.id, locals.user.id, getClientAddress(), timestamp)
		.run();

	return json({ success: true });
};
