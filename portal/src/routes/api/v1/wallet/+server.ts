import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getOrCreateWallet } from '$lib/server/wallet';

export const GET: RequestHandler = async ({ locals, platform }) => {
	if (!locals.user) {
		return json({ error: { code: 'UNAUTHORIZED', message: '請先登入' } }, { status: 401 });
	}

	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	const wallet = await getOrCreateWallet(platform.env.DB, locals.user.id);

	return json({ wallet });
};
