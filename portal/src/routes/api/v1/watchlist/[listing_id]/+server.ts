import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
	if (!locals.user) {
		return json({ error: { code: 'UNAUTHORIZED', message: '請先登入' } }, { status: 401 });
	}
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	const result = await platform.env.DB
		.prepare('DELETE FROM watchlist WHERE user_id = ? AND listing_id = ?')
		.bind(locals.user.id, params.listing_id)
		.run();

	if (!result.meta.changes) {
		return json({ error: { code: 'NOT_FOUND', message: '自選項目不存在' } }, { status: 404 });
	}

	return json({ success: true });
};
