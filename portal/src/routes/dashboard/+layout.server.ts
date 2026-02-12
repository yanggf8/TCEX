import type { LayoutServerLoad } from './$types';
import type { DashboardStats } from '$lib/types/trading';

export const load: LayoutServerLoad = async ({ locals, platform }) => {
	const user = locals.user;

	const stats: DashboardStats = {
		portfolioValue: '0',
		availableBalance: '0',
		positionCount: 0,
		watchlistCount: 0
	};

	if (!user || !platform?.env?.DB) {
		return { user, stats };
	}

	const db = platform.env.DB;

	// Load wallet balance
	const wallet = await db
		.prepare('SELECT available_balance, locked_balance FROM wallets WHERE user_id = ?')
		.bind(user.id)
		.first<{ available_balance: string; locked_balance: string }>();

	if (wallet) {
		stats.availableBalance = wallet.available_balance;
	}

	// Count positions
	const posResult = await db
		.prepare('SELECT COUNT(*) as count FROM positions WHERE user_id = ?')
		.bind(user.id)
		.first<{ count: number }>();

	stats.positionCount = posResult?.count ?? 0;

	// Count watchlist
	const watchResult = await db
		.prepare('SELECT COUNT(*) as count FROM watchlist WHERE user_id = ?')
		.bind(user.id)
		.first<{ count: number }>();

	stats.watchlistCount = watchResult?.count ?? 0;

	return { user, stats };
};
