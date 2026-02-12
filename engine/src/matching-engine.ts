import { OrderBook } from './orderbook';
import { multiply, add, subtract, isZero, ZERO } from './decimal';
import type { OrderRequest, OrderEntry, Trade, MatchResult, OrderBookSnapshot } from './types';

export class MatchingEngine implements DurableObject {
	private orderbook: OrderBook;
	private listingId: string | null = null;
	private initialized = false;
	private db: D1Database;
	private state: DurableObjectState;

	constructor(state: DurableObjectState, env: { DB: D1Database }) {
		this.state = state;
		this.db = env.DB;
		this.orderbook = new OrderBook();
	}

	private async ensureInitialized(listingId: string): Promise<void> {
		if (this.initialized && this.listingId === listingId) return;

		this.listingId = listingId;
		this.orderbook = new OrderBook();

		// Load active orders from DB
		const { results } = await this.db
			.prepare(
				`SELECT id, user_id, side, price, quantity, remaining_quantity, created_at
				 FROM orders
				 WHERE listing_id = ? AND status IN ('pending', 'partial')
				 ORDER BY created_at ASC`
			)
			.bind(listingId)
			.all();

		for (const row of results) {
			const r = row as any;
			this.orderbook.addOrder({
				id: r.id,
				userId: r.user_id,
				side: r.side,
				price: r.price,
				quantity: r.quantity,
				remainingQuantity: r.remaining_quantity,
				createdAt: r.created_at
			});
		}

		// Load last trade
		const lastTrade = await this.db
			.prepare(
				`SELECT price, created_at FROM trades WHERE listing_id = ? ORDER BY created_at DESC LIMIT 1`
			)
			.bind(listingId)
			.first<{ price: string; created_at: string }>();

		if (lastTrade) {
			this.orderbook.lastTradePrice = lastTrade.price;
			this.orderbook.lastTradeTime = lastTrade.created_at;
		}

		this.initialized = true;
	}

	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const pathParts = url.pathname.split('/').filter(Boolean);
		const listingId = request.headers.get('X-Listing-Id');

		if (!listingId) {
			return Response.json({ error: 'Missing X-Listing-Id header' }, { status: 400 });
		}

		await this.ensureInitialized(listingId);

		// WebSocket upgrade
		if (pathParts[0] === 'ws') {
			const upgradeHeader = request.headers.get('Upgrade');
			if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
				return new Response('Expected WebSocket upgrade', { status: 426 });
			}
			const pair = new WebSocketPair();
			const [client, server] = Object.values(pair);
			this.state.acceptWebSocket(server);
			return new Response(null, { status: 101, webSocket: client });
		}

		if (request.method === 'POST' && pathParts[0] === 'order') {
			return this.handlePlaceOrder(request, listingId);
		}

		if (request.method === 'DELETE' && pathParts[0] === 'order' && pathParts[1]) {
			return this.handleCancelOrder(pathParts[1], listingId);
		}

		if (request.method === 'GET' && pathParts[0] === 'orderbook') {
			const depth = parseInt(url.searchParams.get('depth') || '20');
			return Response.json(this.orderbook.getSnapshot(depth));
		}

		return Response.json({ error: 'Not found' }, { status: 404 });
	}

	async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
		// Clients can send subscribe/unsubscribe messages
		// For now, all connected clients receive all broadcasts
		try {
			const data = JSON.parse(typeof message === 'string' ? message : new TextDecoder().decode(message));
			if (data.type === 'ping') {
				ws.send(JSON.stringify({ type: 'pong' }));
			}
		} catch {
			// Ignore malformed messages
		}
	}

	async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): Promise<void> {
		ws.close(code, reason);
	}

	async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
		ws.close(1011, 'Internal error');
	}

	private broadcast(message: object): void {
		const payload = JSON.stringify(message);
		for (const ws of this.state.getWebSockets()) {
			try {
				ws.send(payload);
			} catch {
				// Client disconnected, will be cleaned up
			}
		}
	}

	private async handlePlaceOrder(request: Request, listingId: string): Promise<Response> {
		const body = await request.json() as OrderRequest;

		const timestamp = new Date().toISOString();
		const incoming: OrderEntry = {
			id: body.id,
			userId: body.userId,
			side: body.side,
			price: body.price,
			quantity: body.quantity,
			remainingQuantity: body.quantity,
			createdAt: timestamp
		};

		// Match against orderbook
		const { fills, remaining } = this.orderbook.match(incoming);

		const trades: Trade[] = [];
		const statements: D1PreparedStatement[] = [];

		// Process fills
		for (const fill of fills) {
			const tradeId = crypto.randomUUID();
			const total = multiply(fill.fillQuantity, fill.fillPrice);

			const buyOrderId = incoming.side === 'buy' ? incoming.id : fill.makerOrder.id;
			const sellOrderId = incoming.side === 'sell' ? incoming.id : fill.makerOrder.id;
			const buyerId = incoming.side === 'buy' ? incoming.userId : fill.makerOrder.userId;
			const sellerId = incoming.side === 'sell' ? incoming.userId : fill.makerOrder.userId;

			const trade: Trade = {
				id: tradeId,
				listingId,
				buyOrderId,
				sellOrderId,
				buyerId,
				sellerId,
				price: fill.fillPrice,
				quantity: fill.fillQuantity,
				total,
				createdAt: timestamp
			};
			trades.push(trade);

			// Insert trade
			statements.push(
				this.db.prepare(
					`INSERT INTO trades (id, listing_id, buy_order_id, sell_order_id, buyer_id, seller_id, price, quantity, total, created_at)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
				).bind(tradeId, listingId, buyOrderId, sellOrderId, buyerId, sellerId, fill.fillPrice, fill.fillQuantity, total, timestamp)
			);

			// Update maker order
			const makerFilled = isZero(fill.makerOrder.remainingQuantity);
			statements.push(
				this.db.prepare(
					`UPDATE orders SET filled_quantity = filled_quantity + ?, remaining_quantity = ?, status = ?, updated_at = ?${makerFilled ? ", filled_at = ?" : ""}
					 WHERE id = ?`
				).bind(
					...(makerFilled
						? [fill.fillQuantity, '0', 'filled', timestamp, timestamp, fill.makerOrder.id]
						: [fill.fillQuantity, fill.makerOrder.remainingQuantity, 'partial', timestamp, fill.makerOrder.id])
				)
			);

			// Update buyer's position (upsert)
			statements.push(
				this.db.prepare(
					`INSERT INTO positions (id, user_id, listing_id, quantity, average_cost, realized_pnl, created_at, updated_at)
					 VALUES (?, ?, ?, ?, ?, '0', ?, ?)
					 ON CONFLICT(id) DO UPDATE SET
					   quantity = CAST(CAST(quantity AS REAL) + CAST(? AS REAL) AS TEXT),
					   updated_at = ?`
				).bind(
					`${buyerId}-${listingId}`, buyerId, listingId, fill.fillQuantity, fill.fillPrice, timestamp, timestamp,
					fill.fillQuantity, timestamp
				)
			);

			// Update seller's position
			statements.push(
				this.db.prepare(
					`UPDATE positions SET quantity = CAST(CAST(quantity AS REAL) - CAST(? AS REAL) AS TEXT), updated_at = ?
					 WHERE id = ?`
				).bind(fill.fillQuantity, timestamp, `${sellerId}-${listingId}`)
			);

			// Update buyer wallet: unlock funds (locked during pre-trade), the locked amount was price * qty for the incoming order
			// For maker buy that just got filled, their locked funds also release
			// Credit seller wallet
			statements.push(
				this.db.prepare(
					`UPDATE wallets SET available_balance = CAST(CAST(available_balance AS REAL) + CAST(? AS REAL) AS TEXT),
					 updated_at = ? WHERE user_id = ?`
				).bind(total, timestamp, sellerId)
			);

			// Unlock buyer's locked balance for this fill amount
			statements.push(
				this.db.prepare(
					`UPDATE wallets SET locked_balance = CAST(CAST(locked_balance AS REAL) - CAST(? AS REAL) AS TEXT),
					 updated_at = ? WHERE user_id = ?`
				).bind(total, timestamp, buyerId)
			);
		}

		// Determine incoming order status
		const filledQty = subtract(body.quantity, remaining);
		let status: 'filled' | 'partial' | 'pending';
		if (isZero(remaining)) {
			status = 'filled';
		} else if (filledQty !== ZERO && filledQty !== '0') {
			status = 'partial';
		} else {
			status = 'pending';
		}

		// Update incoming order in DB
		statements.push(
			this.db.prepare(
				`UPDATE orders SET filled_quantity = ?, remaining_quantity = ?, status = ?, updated_at = ?${status === 'filled' ? ", filled_at = ?" : ""}
				 WHERE id = ?`
			).bind(
				...(status === 'filled'
					? [filledQty, '0', status, timestamp, timestamp, body.id]
					: [filledQty, remaining, status, timestamp, body.id])
			)
		);

		// If order still has remaining, add to orderbook
		if (!isZero(remaining)) {
			incoming.remainingQuantity = remaining;
			this.orderbook.addOrder(incoming);
		}

		// Update last trade info
		if (trades.length > 0) {
			const lastTrade = trades[trades.length - 1];
			this.orderbook.lastTradePrice = lastTrade.price;
			this.orderbook.lastTradeTime = lastTrade.createdAt;
		}

		// Execute all DB operations atomically
		if (statements.length > 0) {
			await this.db.batch(statements);
		}

		const result: MatchResult = {
			trades,
			remainingOrder: isZero(remaining) ? null : incoming,
			status
		};

		// Broadcast updates to WebSocket clients
		if (trades.length > 0) {
			this.broadcast({
				type: 'trades',
				listingId,
				trades: trades.map(t => ({ price: t.price, quantity: t.quantity, createdAt: t.createdAt }))
			});
		}
		this.broadcast({
			type: 'orderbook',
			listingId,
			snapshot: this.orderbook.getSnapshot(20)
		});

		return Response.json(result);
	}

	private async handleCancelOrder(orderId: string, listingId: string): Promise<Response> {
		// Try to remove from orderbook
		let removed = this.orderbook.removeOrder(orderId, 'buy');
		if (!removed) {
			removed = this.orderbook.removeOrder(orderId, 'sell');
		}

		if (!removed) {
			return Response.json({ error: 'Order not found in orderbook' }, { status: 404 });
		}

		const timestamp = new Date().toISOString();
		const statements: D1PreparedStatement[] = [];

		statements.push(
			this.db.prepare(
				`UPDATE orders SET status = 'cancelled', cancelled_at = ?, updated_at = ? WHERE id = ?`
			).bind(timestamp, timestamp, orderId)
		);

		// Unlock wallet funds for buy orders
		if (removed.side === 'buy') {
			const lockedAmount = multiply(removed.remainingQuantity, removed.price);
			statements.push(
				this.db.prepare(
					`UPDATE wallets SET
					   available_balance = CAST(CAST(available_balance AS REAL) + CAST(? AS REAL) AS TEXT),
					   locked_balance = CAST(CAST(locked_balance AS REAL) - CAST(? AS REAL) AS TEXT),
					   updated_at = ?
					 WHERE user_id = ?`
				).bind(lockedAmount, lockedAmount, timestamp, removed.userId)
			);
		}

		await this.db.batch(statements);

		// Broadcast orderbook update
		this.broadcast({
			type: 'orderbook',
			listingId,
			snapshot: this.orderbook.getSnapshot(20)
		});

		return Response.json({ success: true });
	}
}
