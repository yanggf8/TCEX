import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { mapPositionWithListingRow } from '$lib/server/db';
import { multiply, add, subtract, ZERO } from '$lib/utils/decimal';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) {
		throw redirect(303, '/login?redirect=/dashboard/portfolio');
	}

	if (!platform?.env?.DB) {
		return {
			positions: [],
			summary: { totalValue: ZERO, totalCost: ZERO, totalRealizedPnl: ZERO, unrealizedPnl: ZERO, positionCount: 0 }
		};
	}

	const { results } = await platform.env.DB
		.prepare(
			`SELECT p.id, p.user_id, p.listing_id, p.quantity, p.average_cost, p.realized_pnl,
				p.created_at, p.updated_at,
				l.symbol as listing_symbol, l.name_zh as listing_name_zh, l.name_en as listing_name_en,
				l.unit_price as listing_unit_price, l.product_type as listing_product_type
			 FROM positions p
			 LEFT JOIN listings l ON p.listing_id = l.id
			 WHERE p.user_id = ? AND CAST(p.quantity AS REAL) > 0
			 ORDER BY p.updated_at DESC`
		)
		.bind(locals.user.id)
		.all();

	const positions = results.map((row: any) => mapPositionWithListingRow(row));

	let totalValue = ZERO;
	let totalCost = ZERO;
	let totalRealizedPnl = ZERO;

	for (const pos of positions) {
		totalValue = add(totalValue, multiply(pos.quantity, pos.listingUnitPrice));
		totalCost = add(totalCost, multiply(pos.quantity, pos.averageCost));
		totalRealizedPnl = add(totalRealizedPnl, pos.realizedPnl);
	}

	return {
		positions,
		summary: {
			totalValue,
			totalCost,
			totalRealizedPnl,
			unrealizedPnl: subtract(totalValue, totalCost),
			positionCount: positions.length
		}
	};
};
