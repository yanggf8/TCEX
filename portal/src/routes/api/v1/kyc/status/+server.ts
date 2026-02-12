import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, platform }) => {
	if (!locals.user) {
		return json({ error: { code: 'UNAUTHORIZED', message: '請先登入' } }, { status: 401 });
	}
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	const db = platform.env.DB;

	const user = await db
		.prepare(
			`SELECT kyc_level, email_verified, phone_verified, full_name, date_of_birth, national_id, address
			 FROM users WHERE id = ?`
		)
		.bind(locals.user.id)
		.first<{
			kyc_level: number;
			email_verified: number | null;
			phone_verified: number | null;
			full_name: string | null;
			date_of_birth: string | null;
			national_id: string | null;
			address: string | null;
		}>();

	if (!user) {
		return json({ error: { code: 'NOT_FOUND', message: '用戶不存在' } }, { status: 404 });
	}

	// Get current pending application if any
	const application = await db
		.prepare(
			`SELECT id, level, status, reviewer_notes, created_at, updated_at
			 FROM kyc_applications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`
		)
		.bind(locals.user.id)
		.first<{
			id: string;
			level: number;
			status: string;
			reviewer_notes: string | null;
			created_at: string;
			updated_at: string;
		}>();

	return json({
		kycLevel: user.kyc_level,
		emailVerified: !!(user.email_verified),
		phoneVerified: !!(user.phone_verified),
		fullName: user.full_name,
		dateOfBirth: user.date_of_birth,
		nationalId: user.national_id,
		address: user.address,
		currentApplication: application ? {
			id: application.id,
			level: application.level,
			status: application.status,
			reviewerNotes: application.reviewer_notes,
			createdAt: application.created_at,
			updatedAt: application.updated_at
		} : null
	});
};
