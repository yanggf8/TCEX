import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user || !platform?.env?.DB) {
		return { recentActivity: [] };
	}

	const db = platform.env.DB;

	// Merge wallet_transactions + trades for recent activity (last 10 events)
	const { results } = await db
		.prepare(`
			SELECT
				wt.id,
				wt.type,
				wt.amount,
				wt.description,
				wt.status,
				wt.created_at,
				wt.reference_type,
				wt.reference_id
			FROM wallet_transactions wt
			WHERE wt.user_id = ?
			ORDER BY wt.created_at DESC
			LIMIT 10
		`)
		.bind(locals.user.id)
		.all<{
			id: string;
			type: string;
			amount: string;
			description: string | null;
			status: string;
			created_at: string;
			reference_type: string | null;
			reference_id: string | null;
		}>();

	return {
		recentActivity: results.map(r => ({
			id: r.id,
			type: r.type,
			amount: r.amount,
			description: r.description,
			status: r.status,
			createdAt: r.created_at,
			referenceType: r.reference_type
		}))
	};
};
