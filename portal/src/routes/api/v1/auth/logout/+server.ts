import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyToken, generateId } from '$lib/server/auth';

const DEV_JWT_SECRET = 'tcex-dev-jwt-secret-do-not-use-in-production';

export const POST: RequestHandler = async ({ request, cookies, platform, getClientAddress }) => {
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}

	const db = platform.env.DB;
	const kv = platform.env.SESSIONS;
	const jwtSecret = platform.env.JWT_SECRET || DEV_JWT_SECRET;

	// Get access token from Authorization header
	const authHeader = request.headers.get('Authorization');
	const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

	// Get refresh token from cookie
	const refreshToken = cookies.get('refreshToken');

	let userId: string | null = null;

	// Try to identify user from access token
	if (accessToken) {
		const payload = await verifyToken(accessToken, jwtSecret);
		if (payload) {
			userId = payload.sub;
		}
	}

	// Remove session from KV if we have a refresh token
	if (refreshToken && userId) {
		await kv.delete(`session:${userId}:${refreshToken.slice(-16)}`);
	}

	// Audit log
	if (userId) {
		const now = new Date().toISOString();
		await db
			.prepare(
				`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, ip_address, created_at)
				 VALUES (?, ?, 'logout', 'user', ?, ?, ?)`
			)
			.bind(generateId(), userId, userId, getClientAddress(), now)
			.run();
	}

	// Clear refresh token cookie
	const response = json({ success: true });
	response.headers.set(
		'Set-Cookie',
		'refreshToken=; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=0'
	);

	return response;
};
