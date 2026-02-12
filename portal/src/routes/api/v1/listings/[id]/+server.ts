import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { mapListingRow } from '$lib/server/db';

export const GET: RequestHandler = async ({ params, platform }) => {
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	const db = platform.env.DB;

	const row = await db
		.prepare('SELECT * FROM listings WHERE id = ?')
		.bind(params.id)
		.first();

	if (!row) {
		return json({ error: { code: 'NOT_FOUND', message: '找不到該標的' } }, { status: 404 });
	}

	return json({ data: mapListingRow(row as any) });
};
