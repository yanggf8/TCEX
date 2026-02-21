import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { withdraw } from '$lib/server/wallet';
import { require2fa } from '$lib/server/2fa-guard';
import { sendNotification, withdrawalEmail } from '$lib/server/notifications';

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user) {
		return json({ error: { code: 'UNAUTHORIZED', message: '請先登入' } }, { status: 401 });
	}

	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	let body: { amount?: string; totpCode?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: { code: 'BAD_REQUEST', message: '無效的請求內容' } }, { status: 400 });
	}

	if (!body.amount) {
		return json({ error: { code: 'BAD_REQUEST', message: '請輸入金額' } }, { status: 400 });
	}

	const db = platform.env.DB;

	// KYC L1 gate for withdrawals
	if (locals.user.kycLevel < 1) {
		return json({ error: { code: 'KYC_REQUIRED', message: '請先完成基本身份驗證才能出金' } }, { status: 403 });
	}

	// 2FA check
	const tfaResult = await require2fa(db, locals.user.id, body.totpCode);
	if (!tfaResult.ok) {
		return json({ error: { code: 'TOTP_REQUIRED', message: tfaResult.message } }, { status: 403 });
	}

	const result = await withdraw(db, locals.user.id, body.amount);

	if (!result.success) {
		const messages: Record<string, string> = {
			invalid_amount: '無效的金額格式',
			amount_must_be_positive: '金額必須為正數',
			amount_below_minimum: '金額低於最低限額 (NT$100)',
			insufficient_balance: '餘額不足'
		};
		return json(
			{ error: { code: 'VALIDATION_ERROR', message: messages[result.error!] || result.error } },
			{ status: 400 }
		);
	}

	// Notify user (non-blocking)
	const displayName = locals.user.displayName ?? null;
	sendNotification(
		platform.env.RESEND_API_KEY,
		locals.user.email,
		'【TCEX】出金申請已受理',
		withdrawalEmail(displayName, result.transaction!.amount, result.wallet!.availableBalance)
	);

	return json({ wallet: result.wallet, transaction: result.transaction });
};
