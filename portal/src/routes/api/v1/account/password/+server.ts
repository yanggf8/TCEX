import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

async function hashPassword(password: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(password);
	const hash = await crypto.subtle.digest('SHA-256', data);
	return Array.from(new Uint8Array(hash))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export const PUT: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user) {
		return json({ error: { code: 'UNAUTHORIZED', message: '請先登入' } }, { status: 401 });
	}
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	let body: { currentPassword?: string; newPassword?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: { code: 'BAD_REQUEST', message: '無效的請求內容' } }, { status: 400 });
	}

	if (!body.currentPassword || !body.newPassword) {
		return json({ error: { code: 'BAD_REQUEST', message: '請填寫所有欄位' } }, { status: 400 });
	}

	if (body.newPassword.length < 12) {
		return json({ error: { code: 'VALIDATION_ERROR', message: '新密碼至少需要 12 個字元' } }, { status: 400 });
	}

	const db = platform.env.DB;

	// Verify current password
	const user = await db
		.prepare('SELECT password_hash FROM users WHERE id = ?')
		.bind(locals.user.id)
		.first<{ password_hash: string }>();

	if (!user) {
		return json({ error: { code: 'NOT_FOUND', message: '用戶不存在' } }, { status: 404 });
	}

	const currentHash = await hashPassword(body.currentPassword);
	if (currentHash !== user.password_hash) {
		return json({ error: { code: 'VALIDATION_ERROR', message: '目前密碼不正確' } }, { status: 400 });
	}

	// Update password
	const newHash = await hashPassword(body.newPassword);
	const timestamp = new Date().toISOString();

	await db
		.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
		.bind(newHash, timestamp, locals.user.id)
		.run();

	return json({ success: true });
};
