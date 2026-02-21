import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user) return json({ error: 'UNAUTHORIZED' }, { status: 401 });
	if (!platform?.env?.DB) return json({ error: 'SERVICE_UNAVAILABLE' }, { status: 503 });

	const admin = await platform.env.DB
		.prepare('SELECT role FROM users WHERE id = ?')
		.bind(locals.user.id)
		.first<{ role: string }>();
	if (admin?.role !== 'admin') return json({ error: 'FORBIDDEN' }, { status: 403 });

	const body = await request.json() as {
		productId?: string; symbol?: string; nameZh?: string; nameEn?: string;
		unitPrice?: string; totalUnits?: string; yieldRate?: string; riskLevel?: string;
	};

	if (!body.productId || !body.symbol || !body.nameZh || !body.nameEn || !body.unitPrice || !body.totalUnits) {
		return json({ error: 'MISSING_FIELDS' }, { status: 400 });
	}

	const product = await platform.env.DB
		.prepare('SELECT id, product_type FROM products WHERE id = ?')
		.bind(body.productId)
		.first<{ id: string; product_type: string }>();
	if (!product) return json({ error: 'PRODUCT_NOT_FOUND' }, { status: 404 });

	const id = 'lst_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
	const now = new Date().toISOString();

	await platform.env.DB.prepare(`
		INSERT INTO listings
		  (id, product_id, product_type, symbol, name_zh, name_en, unit_price,
		   total_units, available_units, yield_rate, risk_level, status, listed_at, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
	`).bind(
		id, body.productId, product.product_type,
		body.symbol.trim(), body.nameZh.trim(), body.nameEn.trim(),
		body.unitPrice, body.totalUnits, body.totalUnits,
		body.yieldRate || null, body.riskLevel || 'medium',
		now, now, now
	).run();

	return json({ id }, { status: 201 });
};
