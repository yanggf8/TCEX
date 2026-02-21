import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	const db = platform!.env.DB;

	const [listingsResult, productsResult] = await Promise.all([
		db.prepare(`
			SELECT l.id, l.symbol, l.name_zh, l.product_type, l.unit_price,
			       l.total_units, l.available_units, l.yield_rate, l.risk_level,
			       l.status, l.listed_at, l.created_at
			FROM listings l
			ORDER BY l.created_at DESC
		`).all<{
			id: string; symbol: string; name_zh: string; product_type: string;
			unit_price: string; total_units: string; available_units: string;
			yield_rate: string | null; risk_level: string; status: string;
			listed_at: string | null; created_at: string;
		}>(),
		db.prepare('SELECT id, name_zh, product_type FROM products ORDER BY name_zh').all<{
			id: string; name_zh: string; product_type: string;
		}>()
	]);

	return {
		listings: listingsResult.results,
		products: productsResult.results
	};
};
