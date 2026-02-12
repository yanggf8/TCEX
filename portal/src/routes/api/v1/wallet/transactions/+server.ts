import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getTransactions, getOrCreateWallet } from '$lib/server/wallet';

export const GET: RequestHandler = async ({ url, locals, platform }) => {
	if (!locals.user) {
		return json({ error: { code: 'UNAUTHORIZED', message: '請先登入' } }, { status: 401 });
	}

	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	// Ensure wallet exists
	await getOrCreateWallet(platform.env.DB, locals.user.id);

	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
	const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
	const type = url.searchParams.get('type') || undefined;

	const { data, total } = await getTransactions(platform.env.DB, locals.user.id, page, limit, type);

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
