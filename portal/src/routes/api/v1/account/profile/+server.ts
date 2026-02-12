import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, platform }) => {
	if (!locals.user) {
		return json({ error: { code: 'UNAUTHORIZED', message: '請先登入' } }, { status: 401 });
	}
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	const row = await platform.env.DB
		.prepare('SELECT id, email, display_name, phone, kyc_level, created_at FROM users WHERE id = ?')
		.bind(locals.user.id)
		.first<{ id: string; email: string; display_name: string | null; phone: string | null; kyc_level: number; created_at: string }>();

	if (!row) {
		return json({ error: { code: 'NOT_FOUND', message: '用戶不存在' } }, { status: 404 });
	}

	return json({
		profile: {
			id: row.id,
			email: row.email,
			displayName: row.display_name,
			phone: row.phone,
			kycLevel: row.kyc_level,
			createdAt: row.created_at
		}
	});
};

export const PUT: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user) {
		return json({ error: { code: 'UNAUTHORIZED', message: '請先登入' } }, { status: 401 });
	}
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	let body: { displayName?: string; phone?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: { code: 'BAD_REQUEST', message: '無效的請求內容' } }, { status: 400 });
	}

	const updates: string[] = [];
	const bindings: (string | null)[] = [];

	if (body.displayName !== undefined) {
		updates.push('display_name = ?');
		bindings.push(body.displayName || null);
	}

	if (body.phone !== undefined) {
		if (body.phone && !/^[0-9+\-() ]{7,20}$/.test(body.phone)) {
			return json({ error: { code: 'VALIDATION_ERROR', message: '電話號碼格式不正確' } }, { status: 400 });
		}
		updates.push('phone = ?');
		bindings.push(body.phone || null);
	}

	if (updates.length === 0) {
		return json({ error: { code: 'BAD_REQUEST', message: '沒有要更新的欄位' } }, { status: 400 });
	}

	updates.push('updated_at = ?');
	bindings.push(new Date().toISOString());
	bindings.push(locals.user.id);

	await platform.env.DB
		.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`)
		.bind(...bindings)
		.run();

	return json({ success: true });
};
