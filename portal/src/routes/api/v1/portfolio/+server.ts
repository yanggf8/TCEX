import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { mapPositionWithListingRow } from '$lib/server/db';
import { multiply, add, subtract, ZERO } from '$lib/utils/decimal';

export const GET: RequestHandler = async ({ locals, platform }) => {
	if (!locals.user) {
		return json({ error: { code: 'UNAUTHORIZED', message: '請先登入' } }, { status: 401 });
	}
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
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
		const marketValue = multiply(pos.quantity, pos.listingUnitPrice);
		totalValue = add(totalValue, marketValue);
		totalCost = add(totalCost, multiply(pos.quantity, pos.averageCost));
		totalRealizedPnl = add(totalRealizedPnl, pos.realizedPnl);
	}

	return json({
		data: positions,
		summary: {
			totalValue,
			totalCost,
			totalRealizedPnl,
			unrealizedPnl: subtract(totalValue, totalCost),
			positionCount: positions.length
		}
	});
};
