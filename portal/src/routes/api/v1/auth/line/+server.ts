import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getLineAuthUrl } from '$lib/server/line-oauth';

export const GET: RequestHandler = async ({ platform, locals }) => {
	if (!platform?.env?.SESSIONS) {
		return new Response('Service unavailable', { status: 503 });
	}

	const channelId = platform.env.LINE_CHANNEL_ID;
	const redirectUri = platform.env.LINE_REDIRECT_URI;

	if (!channelId || !redirectUri) {
		return new Response(JSON.stringify({ error: { code: 'NOT_CONFIGURED', message: 'LINE Login 尚未設定' } }), {
			status: 503,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	// Generate state for CSRF protection
	const state = crypto.randomUUID();
	const kv = platform.env.SESSIONS;

	// Store state in KV with 5-minute TTL, include userId if logged in for linking
	const stateData = JSON.stringify({
		userId: locals.user?.id || null,
		createdAt: new Date().toISOString()
	});
	await kv.put(`line_state:${state}`, stateData, { expirationTtl: 300 });

	const authUrl = getLineAuthUrl(channelId, redirectUri, state);
	throw redirect(302, authUrl);
};
