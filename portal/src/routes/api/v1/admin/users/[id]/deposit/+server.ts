import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, locals, platform }) => {
	if (!locals.user) return json({ error: 'UNAUTHORIZED' }, { status: 401 });
	if (!platform?.env?.DB) return json({ error: 'SERVICE_UNAVAILABLE' }, { status: 503 });

	const admin = await platform.env.DB
		.prepare('SELECT role FROM users WHERE id = ?')
		.bind(locals.user.id)
		.first<{ role: string }>();
	if (admin?.role !== 'admin') return json({ error: 'FORBIDDEN' }, { status: 403 });

	const { amount, note } = await request.json() as { amount?: string; note?: string };
	const parsed = parseFloat(amount ?? '');
	if (isNaN(parsed) || parsed <= 0 || parsed > 10_000_000) {
		return json({ error: 'INVALID_AMOUNT' }, { status: 400 });
	}

	const wallet = await platform.env.DB
		.prepare('SELECT id, available_balance, total_deposited FROM wallets WHERE user_id = ?')
		.bind(params.id)
		.first<{ id: string; available_balance: string; total_deposited: string }>();
	if (!wallet) return json({ error: 'WALLET_NOT_FOUND' }, { status: 404 });

	const balanceBefore = parseFloat(wallet.available_balance);
	const balanceAfter = (balanceBefore + parsed).toFixed(2);
	const totalDeposited = (parseFloat(wallet.total_deposited) + parsed).toFixed(2);
	const now = new Date().toISOString();
	const txId = crypto.randomUUID().replace(/-/g, '');

	await platform.env.DB.batch([
		platform.env.DB.prepare(
			'UPDATE wallets SET available_balance = ?, total_deposited = ?, updated_at = ? WHERE id = ?'
		).bind(balanceAfter, totalDeposited, now, wallet.id),
		platform.env.DB.prepare(`
			INSERT INTO wallet_transactions
			  (id, wallet_id, user_id, type, amount, fee, balance_before, balance_after,
			   reference_type, description, status, created_at)
			VALUES (?, ?, ?, 'deposit', ?, '0', ?, ?, 'admin_mock', ?, 'completed', ?)
		`).bind(
			txId, wallet.id, params.id,
			parsed.toFixed(2),
			wallet.available_balance, balanceAfter,
			note?.trim() || '管理員模擬入帳',
			now
		)
	]);

	return json({ ok: true, balanceAfter });
};
