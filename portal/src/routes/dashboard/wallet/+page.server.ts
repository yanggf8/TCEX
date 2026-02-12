import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getOrCreateWallet, getTransactions } from '$lib/server/wallet';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) {
		throw redirect(303, '/login?redirect=/dashboard/wallet');
	}

	if (!platform?.env?.DB) {
		return {
			wallet: null,
			transactions: [],
			transactionsPagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
		};
	}

	const wallet = await getOrCreateWallet(platform.env.DB, locals.user.id);
	const { data: transactions, total } = await getTransactions(platform.env.DB, locals.user.id, 1, 10);

	return {
		wallet,
		transactions,
		transactionsPagination: {
			page: 1,
			limit: 10,
			total,
			totalPages: Math.ceil(total / 10)
		}
	};
};
