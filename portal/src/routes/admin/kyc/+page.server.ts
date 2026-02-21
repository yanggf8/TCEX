import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform, url }) => {
	const db = platform!.env.DB;
	const status = url.searchParams.get('status') || 'pending';

	const applications = await db
		.prepare(`
			SELECT
				ka.id, ka.level, ka.status, ka.reviewer_notes, ka.created_at, ka.reviewed_at,
				u.id as user_id, u.email, u.display_name, u.full_name, u.date_of_birth,
				u.national_id, u.address, u.phone,
				COUNT(kd.id) as document_count
			FROM kyc_applications ka
			JOIN users u ON ka.user_id = u.id
			LEFT JOIN kyc_documents kd ON ka.id = kd.application_id
			WHERE ka.status = ?
			GROUP BY ka.id
			ORDER BY ka.created_at ASC
		`)
		.bind(status)
		.all<{
			id: string; level: number; status: string; reviewer_notes: string | null;
			created_at: string; reviewed_at: string | null;
			user_id: string; email: string; display_name: string | null; full_name: string | null;
			date_of_birth: string | null; national_id: string | null; address: string | null;
			phone: string | null; document_count: number;
		}>();

	return { applications: applications.results, status };
};
