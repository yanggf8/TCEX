import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, platform }) => {
	if (!locals.user) {
		throw redirect(303, '/login?redirect=/admin');
	}

	if (!platform?.env?.DB) {
		throw redirect(303, '/');
	}

	// Load role from DB (not stored in JWT to avoid stale data)
	const db = platform.env.DB;
	const dbUser = await db
		.prepare('SELECT role FROM users WHERE id = ?')
		.bind(locals.user.id)
		.first<{ role: string }>();

	if (!dbUser || dbUser.role !== 'admin') {
		throw redirect(303, '/dashboard');
	}

	locals.user.role = 'admin';

	return { adminEmail: locals.user.email };
};
