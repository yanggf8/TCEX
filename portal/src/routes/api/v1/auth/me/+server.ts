import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyToken, resolveJwtSecret } from '$lib/server/auth';

export const GET: RequestHandler = async ({ request, cookies, platform }) => {
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	const db = platform.env.DB;
	const jwtSecret = resolveJwtSecret(platform);

	// Read access token from cookie (primary) or Authorization header (API clients)
	const cookieToken = cookies.get('accessToken');
	const authHeader = request.headers.get('Authorization');
	const accessToken = cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);

	if (!accessToken) {
		return json(
			{ error: { code: 'UNAUTHORIZED', message: '請先登入' } },
			{ status: 401 }
		);
	}

	const payload = await verifyToken(accessToken, jwtSecret);
	if (!payload || payload.type !== 'access') {
		return json(
			{ error: { code: 'INVALID_TOKEN', message: '無效的認證令牌' } },
			{ status: 401 }
		);
	}

	// Fetch fresh user data from D1
	const user = await db
		.prepare(
			'SELECT id, email, display_name, phone, kyc_level, status, email_verified, totp_enabled, created_at FROM users WHERE id = ?'
		)
		.bind(payload.sub)
		.first<{
			id: string;
			email: string;
			display_name: string | null;
			phone: string | null;
			kyc_level: number;
			status: string;
			email_verified: number | null;
			totp_enabled: number | null;
			created_at: string;
		}>();

	if (!user || user.status !== 'active') {
		return json(
			{ error: { code: 'USER_NOT_FOUND', message: '使用者不存在或已被停用' } },
			{ status: 404 }
		);
	}

	return json({
		user: {
			id: user.id,
			email: user.email,
			displayName: user.display_name,
			phone: user.phone,
			kycLevel: user.kyc_level,
			emailVerified: !!(user.email_verified),
			totpEnabled: !!(user.totp_enabled),
			createdAt: user.created_at
		}
	});
};
