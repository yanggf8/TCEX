import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { mapOrderWithListingRow } from '$lib/server/db';
import { validateOrder, lockFundsForBuy, unlockFunds } from '$lib/server/order-validation';
import { multiply, subtract, gte } from '$lib/utils/decimal';
import { require2fa } from '$lib/server/2fa-guard';
import { generateId } from '$lib/server/auth';

export const GET: RequestHandler = async ({ url, locals, platform }) => {
	if (!locals.user) {
		return json({ error: { code: 'UNAUTHORIZED', message: '請先登入' } }, { status: 401 });
	}
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
	const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
	const status = url.searchParams.get('status') || undefined;
	const side = url.searchParams.get('side') || undefined;
	const offset = (page - 1) * limit;

	let whereClause = 'WHERE o.user_id = ?';
	const bindings: (string | number)[] = [locals.user.id];

	if (status) {
		whereClause += ' AND o.status = ?';
		bindings.push(status);
	}
	if (side) {
		whereClause += ' AND o.side = ?';
		bindings.push(side);
	}

	const countResult = await platform.env.DB
		.prepare(`SELECT COUNT(*) as total FROM orders o ${whereClause}`)
		.bind(...bindings)
		.first<{ total: number }>();

	const total = countResult?.total ?? 0;

	const { results } = await platform.env.DB
		.prepare(
			`SELECT o.*, l.symbol as listing_symbol, l.name_zh as listing_name_zh, l.name_en as listing_name_en
			 FROM orders o
			 LEFT JOIN listings l ON o.listing_id = l.id
			 ${whereClause}
			 ORDER BY o.created_at DESC LIMIT ? OFFSET ?`
		)
		.bind(...bindings, limit, offset)
		.all();

	const data = results.map((row: any) => mapOrderWithListingRow(row));

	return json({
		data,
		pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
	});
};

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user) {
		return json({ error: { code: 'UNAUTHORIZED', message: '請先登入' } }, { status: 401 });
	}
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	let body: { listingId?: string; side?: string; price?: string; quantity?: string; totpCode?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: { code: 'BAD_REQUEST', message: '無效的請求內容' } }, { status: 400 });
	}

	if (!body.listingId || !body.side || !body.price || !body.quantity) {
		return json({ error: { code: 'BAD_REQUEST', message: '請填寫所有必要欄位' } }, { status: 400 });
	}

	if (body.side !== 'buy' && body.side !== 'sell') {
		return json({ error: { code: 'BAD_REQUEST', message: '無效的委託方向' } }, { status: 400 });
	}

	const db = platform.env.DB;

	// KYC L2 gate
	if (locals.user.kycLevel < 2) {
		return json({ error: { code: 'KYC_REQUIRED', message: '請先完成 L2 身份驗證才能交易' } }, { status: 403 });
	}

	// 2FA check
	const tfaResult = await require2fa(db, locals.user.id, body.totpCode);
	if (!tfaResult.ok) {
		return json({ error: { code: 'TOTP_REQUIRED', message: tfaResult.message } }, { status: 403 });
	}

	// Pre-trade validation
	const validation = await validateOrder(db, {
		listingId: body.listingId,
		side: body.side as 'buy' | 'sell',
		price: body.price,
		quantity: body.quantity,
		userId: locals.user.id
	});

	if (!validation.valid) {
		const messages: Record<string, string> = {
			invalid_price: '無效的價格',
			invalid_quantity: '無效的數量',
			listing_not_found: '標的不存在',
			listing_not_active: '標的目前未開放交易',
			price_out_of_range: '價格超出允許範圍 (±10%)',
			insufficient_balance: '餘額不足',
			insufficient_position: '持倉不足',
			wallet_not_found: '請先入金'
		};
		return json(
			{ error: { code: 'VALIDATION_ERROR', message: messages[validation.error!] || validation.error } },
			{ status: 400 }
		);
	}

	// Lock funds for buy orders BEFORE creating the order record
	const lockedAmount = body.side === 'buy' ? multiply(body.quantity, body.price) : '0';
	if (body.side === 'buy') {
		const lockResult = await lockFundsForBuy(db, locals.user.id, lockedAmount);
		if (!lockResult.success) {
			return json(
				{ error: { code: 'INSUFFICIENT_BALANCE', message: '餘額不足（並發操作衝突，請重試）' } },
				{ status: 409 }
			);
		}
	}

	// Create order record
	const orderId = crypto.randomUUID();
	const timestamp = new Date().toISOString();

	await db
		.prepare(
			`INSERT INTO orders (id, user_id, listing_id, side, type, status, price, quantity, filled_quantity, remaining_quantity, created_at, updated_at)
			 VALUES (?, ?, ?, ?, 'limit', 'pending', ?, ?, '0', ?, ?, ?)`
		)
		.bind(orderId, locals.user.id, body.listingId, body.side, body.price, body.quantity, body.quantity, timestamp, timestamp)
		.run();

	// Forward to matching engine via Service Binding
	const engineEnv = (platform.env as any).ENGINE as Fetcher | undefined;

	if (engineEnv) {
		try {
			const engineRes = await engineEnv.fetch(
				`https://engine/v1/listing/${body.listingId}/order`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						id: orderId,
						userId: locals.user.id,
						listingId: body.listingId,
						side: body.side,
						type: 'limit',
						price: body.price,
						quantity: body.quantity
					})
				}
			);

			if (!engineRes.ok) {
				throw new Error(`Engine returned ${engineRes.status}`);
			}

			const matchResult = await engineRes.json() as { trades?: Array<{ price: string; quantity: string }>; [key: string]: unknown };

			// Fix #4: Price improvement — unlock excess locked funds for buy orders
			if (body.side === 'buy' && matchResult.trades && matchResult.trades.length > 0) {
				let actualCost = '0';
				for (const trade of matchResult.trades) {
					actualCost = (await import('$lib/utils/decimal')).add(
						actualCost,
						multiply(trade.quantity, trade.price)
					);
				}
				// If filled at better price, unlock the difference
				if (gte(lockedAmount, actualCost) && lockedAmount !== actualCost) {
					const excess = subtract(lockedAmount, actualCost);
					if (excess !== '0') {
						await unlockFunds(db, locals.user.id, excess);
					}
				}
			}

			return json({ orderId, ...matchResult }, { status: 201 });
		} catch (err) {
			// Fix #3: Engine failure — rollback order and unlock funds
			console.error('Engine error:', err);

			const rollbackTimestamp = new Date().toISOString();

			// Mark order as failed
			await db
				.prepare(`UPDATE orders SET status = 'failed', updated_at = ? WHERE id = ?`)
				.bind(rollbackTimestamp, orderId)
				.run();

			// Unlock funds for buy orders
			if (body.side === 'buy') {
				await unlockFunds(db, locals.user.id, lockedAmount);
			}

			// Audit the failure
			await db
				.prepare(
					`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, ip_address, created_at)
					 VALUES (?, ?, 'order_engine_failure', 'order', ?, ?, '', ?)`
				)
				.bind(generateId(), locals.user.id, orderId, `Engine error: ${err instanceof Error ? err.message : 'unknown'}`, rollbackTimestamp)
				.run();

			return json(
				{ error: { code: 'ENGINE_ERROR', message: '撮合引擎暫時無法使用，委託已取消' } },
				{ status: 503 }
			);
		}
	}

	return json({ orderId, status: 'pending', trades: [] }, { status: 201 });
};
