import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, locals, platform }) => {
	if (!locals.user) {
		return json({ error: 'UNAUTHORIZED' }, { status: 401 });
	}
	if (!platform?.env?.DB || !platform?.env?.DOCUMENTS) {
		return json({ error: 'SERVICE_UNAVAILABLE' }, { status: 503 });
	}

	// Verify admin role from DB
	const user = await platform.env.DB
		.prepare('SELECT role FROM users WHERE id = ?')
		.bind(locals.user.id)
		.first<{ role: string }>();

	if (user?.role !== 'admin') {
		return json({ error: 'FORBIDDEN' }, { status: 403 });
	}

	// Look up the document
	const doc = await platform.env.DB
		.prepare('SELECT r2_key, file_name, content_type FROM kyc_documents WHERE id = ?')
		.bind(params.id)
		.first<{ r2_key: string; file_name: string; content_type: string }>();

	if (!doc) {
		return json({ error: 'NOT_FOUND' }, { status: 404 });
	}

	// Stream from R2
	const object = await platform.env.DOCUMENTS.get(doc.r2_key);
	if (!object) {
		return json({ error: 'FILE_NOT_FOUND' }, { status: 404 });
	}

	return new Response(object.body, {
		headers: {
			'Content-Type': doc.content_type,
			'Content-Disposition': `inline; filename="${doc.file_name}"`,
			'Cache-Control': 'private, max-age=300'
		}
	});
};
