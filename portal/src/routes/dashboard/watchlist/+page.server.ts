import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { mapWatchlistItemRow } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) {
		throw redirect(303, '/login?redirect=/dashboard/watchlist');
	}

	if (!platform?.env?.DB) {
		return { items: [] };
	}

	const { results } = await platform.env.DB
		.prepare(
			`SELECT w.id, w.user_id, w.listing_id, w.created_at,
				l.symbol as listing_symbol, l.name_zh as listing_name_zh, l.name_en as listing_name_en,
				l.unit_price as listing_unit_price, l.product_type as listing_product_type,
				l.yield_rate as listing_yield_rate, l.risk_level as listing_risk_level, l.status as listing_status
			 FROM watchlist w
			 LEFT JOIN listings l ON w.listing_id = l.id
			 WHERE w.user_id = ?
			 ORDER BY w.created_at DESC`
		)
		.bind(locals.user.id)
		.all();

	return { items: results.map((row: any) => mapWatchlistItemRow(row)) };
};
