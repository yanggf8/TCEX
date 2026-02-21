import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	if (!platform?.env?.DB) {
		return { marketStats: null };
	}

	const db = platform.env.DB;
	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);
	const todayIso = todayStart.toISOString();

	const [activeListings, tradeVolume, todayDistributions, userCount] = await Promise.all([
		db.prepare("SELECT COUNT(*) as count FROM listings WHERE status = 'active'")
			.first<{ count: number }>(),

		db.prepare("SELECT COALESCE(SUM(CAST(total AS REAL)), 0) as volume FROM trades")
			.first<{ volume: number }>(),

		db.prepare(`SELECT COALESCE(SUM(CAST(total_amount AS REAL)), 0) as total
			FROM distributions WHERE status = 'paid' AND payment_date >= ?`)
			.bind(todayIso.slice(0, 10))
			.first<{ total: number }>(),

		db.prepare("SELECT COUNT(*) as count FROM users")
			.first<{ count: number }>()
	]);

	return {
		marketStats: {
			activeListings: activeListings?.count ?? 0,
			totalVolume: tradeVolume?.volume ?? 0,
			todayDistributions: todayDistributions?.total ?? 0,
			userCount: userCount?.count ?? 0
		}
	};
};
