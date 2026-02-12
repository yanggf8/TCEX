import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { mapOrderRow } from '$lib/server/db';
import { add } from '$lib/utils/decimal';

export const GET: RequestHandler = async ({ params, locals, platform }) => {
	if (!locals.user) {
		return json({ error: { code: 'UNAUTHORIZED', message: '請先登入' } }, { status: 401 });
	}
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	const row = await platform.env.DB
		.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?')
		.bind(params.id, locals.user.id)
		.first();

	if (!row) {
		return json({ error: { code: 'NOT_FOUND', message: '委託單不存在' } }, { status: 404 });
	}

	return json({ order: mapOrderRow(row as any) });
};

export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
	if (!locals.user) {
		return json({ error: { code: 'UNAUTHORIZED', message: '請先登入' } }, { status: 401 });
	}
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	const db = platform.env.DB;

	const row = await db
		.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?')
		.bind(params.id, locals.user.id)
		.first<any>();

	if (!row) {
		return json({ error: { code: 'NOT_FOUND', message: '委託單不存在' } }, { status: 404 });
	}

	if (row.status !== 'pending' && row.status !== 'partial') {
		return json({ error: { code: 'BAD_REQUEST', message: '此委託單無法取消' } }, { status: 400 });
	}

	const timestamp = new Date().toISOString();
	const statements: D1PreparedStatement[] = [];

	// Cancel the order
	statements.push(
		db.prepare(
			`UPDATE orders SET status = 'cancelled', cancelled_at = ?, updated_at = ? WHERE id = ?`
		).bind(timestamp, timestamp, params.id)
	);

	// Unlock wallet funds for buy orders
	if (row.side === 'buy' && row.price) {
		const lockedAmount = (
			parseFloat(row.remaining_quantity) * parseFloat(row.price)
		).toFixed(2);

		const wallet = await db
			.prepare('SELECT id, available_balance, locked_balance FROM wallets WHERE user_id = ?')
			.bind(locals.user.id)
			.first<{ id: string; available_balance: string; locked_balance: string }>();

		if (wallet) {
			const newAvailable = add(wallet.available_balance, lockedAmount);
			const newLocked = (parseFloat(wallet.locked_balance) - parseFloat(lockedAmount)).toFixed(2);

			statements.push(
				db.prepare(
					`UPDATE wallets SET available_balance = ?, locked_balance = ?, updated_at = ? WHERE id = ?`
				).bind(newAvailable, newLocked, timestamp, wallet.id)
			);
		}
	}

	await db.batch(statements);

	return json({ success: true });
};
