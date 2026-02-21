import type { PageServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';
import { mapListingRow } from '$lib/server/db';

export const load: PageServerLoad = async ({ params, locals, platform }) => {
	if (!locals.user) {
		throw redirect(303, '/login?redirect=/dashboard/trade/' + params.listing_id);
	}

	if (!platform?.env?.DB) {
		throw error(503, 'Service unavailable');
	}

	const db = platform.env.DB;

	// Load listing
	const listingRow = await db
		.prepare('SELECT * FROM listings WHERE id = ?')
		.bind(params.listing_id)
		.first();

	if (!listingRow) {
		throw error(404, 'Listing not found');
	}

	const listing = mapListingRow(listingRow as any);

	// Load wallet balance
	const wallet = await db
		.prepare('SELECT available_balance, locked_balance FROM wallets WHERE user_id = ?')
		.bind(locals.user.id)
		.first<{ available_balance: string; locked_balance: string }>();

	// Load user's open orders for this listing
	const { results: openOrders } = await db
		.prepare(
			`SELECT id, side, price, quantity, filled_quantity, remaining_quantity, status, created_at
			 FROM orders
			 WHERE user_id = ? AND listing_id = ? AND status IN ('pending', 'partial')
			 ORDER BY created_at DESC`
		)
		.bind(locals.user.id, params.listing_id)
		.all();

	// Load user's position for this listing
	const position = await db
		.prepare('SELECT quantity, average_cost FROM positions WHERE id = ?')
		.bind(`${locals.user.id}-${params.listing_id}`)
		.first<{ quantity: string; average_cost: string }>();

	// Load recent trades
	const { results: recentTrades } = await db
		.prepare(
			`SELECT price, quantity, created_at FROM trades
			 WHERE listing_id = ?
			 ORDER BY created_at DESC LIMIT 30`
		)
		.bind(params.listing_id)
		.all();

	// Load initial orderbook snapshot from engine
	let initialOrderbook = null;
	if (platform.env.ENGINE) {
		try {
			const res = await platform.env.ENGINE.fetch(
				`https://tcex-engine/v1/listing/${params.listing_id}/orderbook?depth=20`
			);
			if (res.ok) {
				initialOrderbook = await res.json();
			}
		} catch {
			// Engine unavailable — frontend will populate via WebSocket
		}
	}

	return {
		listing,
		availableBalance: wallet?.available_balance || '0',
		lockedBalance: wallet?.locked_balance || '0',
		position: position ? { quantity: position.quantity, averageCost: position.average_cost } : null,
		openOrders: openOrders.map((o: any) => ({
			id: o.id,
			side: o.side,
			price: o.price,
			quantity: o.quantity,
			filledQuantity: o.filled_quantity,
			remainingQuantity: o.remaining_quantity,
			status: o.status,
			createdAt: o.created_at
		})),
		recentTrades: recentTrades.map((t: any) => ({
			price: t.price,
			quantity: t.quantity,
			createdAt: t.created_at
		})),
		initialOrderbook
	};
};
