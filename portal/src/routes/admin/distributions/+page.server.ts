import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	const db = platform!.env.DB;

	const [listings, recent] = await Promise.all([
		db.prepare(`
			SELECT id, symbol, name_zh, name_en, product_type
			FROM listings WHERE status = 'active' ORDER BY symbol ASC
		`).all<{ id: string; symbol: string; name_zh: string; name_en: string; product_type: string }>(),

		db.prepare(`
			SELECT d.*, l.symbol as listing_symbol, l.name_zh as listing_name_zh,
				(SELECT COUNT(*) FROM distribution_payments dp WHERE dp.distribution_id = d.id) as recipient_count
			FROM distributions d
			LEFT JOIN listings l ON d.listing_id = l.id
			ORDER BY d.created_at DESC LIMIT 20
		`).all<{
			id: string; listing_id: string; listing_symbol: string; listing_name_zh: string;
			type: string; amount_per_unit: string; total_amount: string;
			record_date: string; payment_date: string | null; status: string;
			description: string | null; created_at: string; recipient_count: number;
		}>()
	]);

	return {
		listings: listings.results,
		recent: recent.results
	};
};
