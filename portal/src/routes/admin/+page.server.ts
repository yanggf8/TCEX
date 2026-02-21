import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	const db = platform!.env.DB;

	const [userCount, pendingKyc, totalTrades, activeOrders] = await Promise.all([
		db.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>(),
		db.prepare("SELECT COUNT(*) as count FROM kyc_applications WHERE status = 'pending'").first<{ count: number }>(),
		db.prepare('SELECT COUNT(*) as count FROM trades').first<{ count: number }>(),
		db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'open'").first<{ count: number }>()
	]);

	return {
		stats: {
			userCount: userCount?.count ?? 0,
			pendingKyc: pendingKyc?.count ?? 0,
			totalTrades: totalTrades?.count ?? 0,
			activeOrders: activeOrders?.count ?? 0
		}
	};
};
