import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	const stats = {
		totalListings: 0,
		rboCount: 0,
		spvCount: 0,
		spacCount: 0
	};

	if (!platform?.env?.DB) {
		return { stats };
	}

	const db = platform.env.DB;

	const totalResult = await db
		.prepare('SELECT COUNT(*) as count FROM listings WHERE status = ?')
		.bind('active')
		.first<{ count: number }>();

	stats.totalListings = totalResult?.count ?? 0;

	const typeResults = await db
		.prepare(
			`SELECT product_type, COUNT(*) as count FROM listings WHERE status = ? GROUP BY product_type`
		)
		.bind('active')
		.all();

	for (const row of typeResults.results as any[]) {
		if (row.product_type === 'RBO') stats.rboCount = row.count;
		else if (row.product_type === 'SPV') stats.spvCount = row.count;
		else if (row.product_type === 'SPAC') stats.spacCount = row.count;
	}

	return { stats };
};
