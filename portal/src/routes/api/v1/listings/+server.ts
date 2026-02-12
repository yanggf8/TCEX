import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { mapListingSummaryRow } from '$lib/server/db';

export const GET: RequestHandler = async ({ url, platform }) => {
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	const db = platform.env.DB;

	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
	const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
	const productType = url.searchParams.get('type');
	const status = url.searchParams.get('status') || 'active';
	const offset = (page - 1) * limit;

	let whereClause = 'WHERE status = ?';
	const bindings: (string | number)[] = [status];

	if (productType) {
		whereClause += ' AND product_type = ?';
		bindings.push(productType);
	}

	// Count total
	const countResult = await db
		.prepare(`SELECT COUNT(*) as total FROM listings ${whereClause}`)
		.bind(...bindings)
		.first<{ total: number }>();

	const total = countResult?.total ?? 0;

	// Fetch page
	const { results } = await db
		.prepare(
			`SELECT * FROM listings ${whereClause} ORDER BY listed_at DESC LIMIT ? OFFSET ?`
		)
		.bind(...bindings, limit, offset)
		.all();

	const data = results.map((row: any) => mapListingSummaryRow(row));

	return json({
		data,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit)
		}
	});
};
