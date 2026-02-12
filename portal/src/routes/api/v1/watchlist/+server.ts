import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { mapWatchlistItemRow } from '$lib/server/db';

export const GET: RequestHandler = async ({ locals, platform }) => {
	if (!locals.user) {
		return json({ error: { code: 'UNAUTHORIZED', message: '請先登入' } }, { status: 401 });
	}
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	const { results } = await platform.env.DB
		.prepare(
			`SELECT w.id, w.user_id, w.listing_id, w.created_at,
				l.symbol as listing_symbol, l.name_zh as listing_name_zh, l.name_en as listing_name_en,
				l.unit_price as listing_unit_price, l.product_type as listing_product_type,
				l.yield_rate as listing_yield_rate, l.risk_level as listing_risk_level, l.status as listing_status
			 FROM watchlist w
			 LEFT JOIN listings l ON w.listing_id = l.id
			 WHERE w.user_id = ?
			 ORDER BY w.created_at DESC`
		)
		.bind(locals.user.id)
		.all();

	const data = results.map((row: any) => mapWatchlistItemRow(row));
	return json({ data });
};

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user) {
		return json({ error: { code: 'UNAUTHORIZED', message: '請先登入' } }, { status: 401 });
	}
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	let body: { listingId?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: { code: 'BAD_REQUEST', message: '無效的請求內容' } }, { status: 400 });
	}

	if (!body.listingId) {
		return json({ error: { code: 'BAD_REQUEST', message: '請提供標的 ID' } }, { status: 400 });
	}

	// Check listing exists
	const listing = await platform.env.DB
		.prepare('SELECT id FROM listings WHERE id = ?')
		.bind(body.listingId)
		.first();

	if (!listing) {
		return json({ error: { code: 'NOT_FOUND', message: '標的不存在' } }, { status: 404 });
	}

	// Check not already in watchlist
	const existing = await platform.env.DB
		.prepare('SELECT id FROM watchlist WHERE user_id = ? AND listing_id = ?')
		.bind(locals.user.id, body.listingId)
		.first();

	if (existing) {
		return json({ error: { code: 'CONFLICT', message: '已在自選清單中' } }, { status: 409 });
	}

	const id = crypto.randomUUID();
	const timestamp = new Date().toISOString();

	await platform.env.DB
		.prepare('INSERT INTO watchlist (id, user_id, listing_id, created_at) VALUES (?, ?, ?, ?)')
		.bind(id, locals.user.id, body.listingId, timestamp)
		.run();

	return json({ id, listingId: body.listingId }, { status: 201 });
};
