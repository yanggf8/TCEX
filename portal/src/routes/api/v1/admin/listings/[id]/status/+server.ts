import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, locals, platform }) => {
	if (!locals.user) return json({ error: 'UNAUTHORIZED' }, { status: 401 });
	if (!platform?.env?.DB) return json({ error: 'SERVICE_UNAVAILABLE' }, { status: 503 });

	const admin = await platform.env.DB
		.prepare('SELECT role FROM users WHERE id = ?')
		.bind(locals.user.id)
		.first<{ role: string }>();
	if (admin?.role !== 'admin') return json({ error: 'FORBIDDEN' }, { status: 403 });

	const { status } = await request.json() as { status?: string };
	if (!['active', 'suspended', 'closed'].includes(status ?? '')) {
		return json({ error: 'INVALID_STATUS' }, { status: 400 });
	}

	const result = await platform.env.DB
		.prepare('UPDATE listings SET status = ?, updated_at = ? WHERE id = ?')
		.bind(status, new Date().toISOString(), params.id)
		.run();

	if (!result.meta.changes) return json({ error: 'NOT_FOUND' }, { status: 404 });

	return json({ ok: true });
};
