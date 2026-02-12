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
				emailVerified: locals.user.emailVerified,
				totpEnabled: locals.user.totpEnabled,
				phoneVerified: false,
				createdAt: ''
			},
			lineAccount: null,
			kycApplication: null
		};
	}

	const db = platform.env.DB;

	const row = await db
		.prepare(
			`SELECT id, email, display_name, phone, kyc_level, email_verified, totp_enabled, phone_verified, created_at
			 FROM users WHERE id = ?`
		)
		.bind(locals.user.id)
		.first<{
			id: string;
			email: string;
			display_name: string | null;
			phone: string | null;
			kyc_level: number;
			email_verified: number | null;
			totp_enabled: number | null;
			phone_verified: number | null;
			created_at: string;
		}>();

	// Load LINE account link
	const lineRow = await db
		.prepare('SELECT line_user_id, display_name, picture_url FROM line_accounts WHERE user_id = ?')
		.bind(locals.user.id)
		.first<{ line_user_id: string; display_name: string | null; picture_url: string | null }>();

	// Load current KYC application
	const kycRow = await db
		.prepare("SELECT id, level, status, reviewer_notes, created_at FROM kyc_applications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1")
		.bind(locals.user.id)
		.first<{ id: string; level: number; status: string; reviewer_notes: string | null; created_at: string }>();

	const profile = row
		? {
				id: row.id,
				email: row.email,
				displayName: row.display_name,
				phone: row.phone,
				kycLevel: row.kyc_level,
				emailVerified: !!(row.email_verified),
				totpEnabled: !!(row.totp_enabled),
				phoneVerified: !!(row.phone_verified),
				createdAt: row.created_at
			}
		: {
				id: locals.user.id,
				email: locals.user.email,
				displayName: locals.user.displayName,
				phone: null,
				kycLevel: locals.user.kycLevel,
				emailVerified: locals.user.emailVerified,
				totpEnabled: locals.user.totpEnabled,
				phoneVerified: false,
				createdAt: ''
			};

	return {
		profile,
		lineAccount: lineRow ? {
			lineUserId: lineRow.line_user_id,
			displayName: lineRow.display_name,
			pictureUrl: lineRow.picture_url
		} : null,
		kycApplication: kycRow ? {
			id: kycRow.id,
			level: kycRow.level,
			status: kycRow.status,
			reviewerNotes: kycRow.reviewer_notes,
			createdAt: kycRow.created_at
		} : null
	};
};
