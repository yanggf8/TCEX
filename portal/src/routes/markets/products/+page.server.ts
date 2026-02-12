import type { PageServerLoad } from './$types';
import { mapProductRow } from '$lib/server/db';
import type { Product } from '$lib/types/trading';

export const load: PageServerLoad = async ({ platform }) => {
	const products: Product[] = [];

	if (!platform?.env?.DB) {
		return { products };
	}

	const db = platform.env.DB;

	const { results } = await db
		.prepare('SELECT * FROM products WHERE status = ? ORDER BY display_order ASC')
		.bind('active')
		.all();

	return {
		products: results.map((row: any) => mapProductRow(row))
	};
};
