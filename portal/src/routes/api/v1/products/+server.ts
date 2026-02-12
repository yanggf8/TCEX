import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { mapProductRow } from '$lib/server/db';

export const GET: RequestHandler = async ({ platform }) => {
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	const db = platform.env.DB;

	const { results } = await db
		.prepare('SELECT * FROM products WHERE status = ? ORDER BY display_order ASC')
		.bind('active')
		.all();

	const products = results.map((row: any) => mapProductRow(row));

	return json({ data: products });
};
