import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) {
		throw redirect(303, '/login?redirect=/dashboard/settings');
	}

	if (!platform?.env?.DB) {
		return {
			profile: {
				id: locals.user.id,
				email: locals.user.email,
				displayName: locals.user.displayName,
				phone: null,
				kycLevel: locals.user.kycLevel,
				createdAt: ''
			}
		};
	}

	const row = await platform.env.DB
		.prepare('SELECT id, email, display_name, phone, kyc_level, created_at FROM users WHERE id = ?')
		.bind(locals.user.id)
		.first<{ id: string; email: string; display_name: string | null; phone: string | null; kyc_level: number; created_at: string }>();

	return {
		profile: row
			? {
					id: row.id,
					email: row.email,
					displayName: row.display_name,
					phone: row.phone,
					kycLevel: row.kyc_level,
					createdAt: row.created_at
				}
			: {
					id: locals.user.id,
					email: locals.user.email,
					displayName: locals.user.displayName,
					phone: null,
					kycLevel: locals.user.kycLevel,
					createdAt: ''
				}
	};
};
