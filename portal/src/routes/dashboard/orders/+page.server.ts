import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { mapOrderWithListingRow } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) {
		throw redirect(303, '/login?redirect=/dashboard/orders');
	}

	if (!platform?.env?.DB) {
		return {
			activeOrders: [],
			historyOrders: [],
			summary: { activeCount: 0, filledCount: 0, cancelledCount: 0 }
		};
	}

	const db = platform.env.DB;

	// Active orders (pending + partial)
	const { results: activeResults } = await db
		.prepare(
			`SELECT o.*, l.symbol as listing_symbol, l.name_zh as listing_name_zh, l.name_en as listing_name_en
			 FROM orders o
			 LEFT JOIN listings l ON o.listing_id = l.id
			 WHERE o.user_id = ? AND o.status IN ('pending', 'partial')
			 ORDER BY o.created_at DESC`
		)
		.bind(locals.user.id)
		.all();

	// History orders (filled + cancelled), last 50
	const { results: historyResults } = await db
		.prepare(
			`SELECT o.*, l.symbol as listing_symbol, l.name_zh as listing_name_zh, l.name_en as listing_name_en
			 FROM orders o
			 LEFT JOIN listings l ON o.listing_id = l.id
			 WHERE o.user_id = ? AND o.status IN ('filled', 'cancelled')
			 ORDER BY o.created_at DESC LIMIT 50`
		)
		.bind(locals.user.id)
		.all();

	// Counts
	const countResult = await db
		.prepare(
			`SELECT
				SUM(CASE WHEN status IN ('pending', 'partial') THEN 1 ELSE 0 END) as active_count,
				SUM(CASE WHEN status = 'filled' THEN 1 ELSE 0 END) as filled_count,
				SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count
			 FROM orders WHERE user_id = ?`
		)
		.bind(locals.user.id)
		.first<{ active_count: number; filled_count: number; cancelled_count: number }>();

	return {
		activeOrders: activeResults.map((row: any) => mapOrderWithListingRow(row)),
		historyOrders: historyResults.map((row: any) => mapOrderWithListingRow(row)),
		summary: {
			activeCount: countResult?.active_count ?? 0,
			filledCount: countResult?.filled_count ?? 0,
			cancelledCount: countResult?.cancelled_count ?? 0
		}
	};
};
