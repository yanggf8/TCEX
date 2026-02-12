import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deposit } from '$lib/server/wallet';

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user) {
		return json({ error: { code: 'UNAUTHORIZED', message: '請先登入' } }, { status: 401 });
	}

	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	let body: { amount?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: { code: 'BAD_REQUEST', message: '無效的請求內容' } }, { status: 400 });
	}

	if (!body.amount) {
		return json({ error: { code: 'BAD_REQUEST', message: '請輸入金額' } }, { status: 400 });
	}

	const result = await deposit(platform.env.DB, locals.user.id, body.amount);

	if (!result.success) {
		const messages: Record<string, string> = {
			invalid_amount: '無效的金額格式',
			amount_must_be_positive: '金額必須為正數',
			amount_below_minimum: '金額低於最低限額 (NT$100)',
			amount_exceeds_maximum: '金額超過最高限額'
		};
		return json(
			{ error: { code: 'VALIDATION_ERROR', message: messages[result.error!] || result.error } },
			{ status: 400 }
		);
	}

	return json({ wallet: result.wallet, transaction: result.transaction });
};
