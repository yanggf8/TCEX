import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform, url }) => {
	const db = platform!.env.DB;
	const search = url.searchParams.get('q') || '';
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = 20;
	const offset = (page - 1) * limit;

	const where = search ? `WHERE u.email LIKE ? OR u.display_name LIKE ?` : '';
	const params = search ? [`%${search}%`, `%${search}%`] : [];

	const [users, total] = await Promise.all([
		db.prepare(`
			SELECT id, email, display_name, kyc_level, status, role, created_at, email_verified, phone_verified
			FROM users ${where}
			ORDER BY created_at DESC LIMIT ? OFFSET ?
		`).bind(...params, limit, offset).all<{
			id: string; email: string; display_name: string | null;
			kyc_level: number; status: string; role: string;
			created_at: string; email_verified: number; phone_verified: number;
		}>(),
		db.prepare(`SELECT COUNT(*) as count FROM users ${where}`)
			.bind(...params).first<{ count: number }>()
	]);

	return {
		users: users.results,
		total: total?.count ?? 0,
		page,
		pages: Math.ceil((total?.count ?? 0) / limit),
		search
	};
};
