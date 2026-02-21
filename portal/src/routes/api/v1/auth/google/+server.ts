import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGoogleAuthUrl } from '$lib/server/google-oauth';

export const GET: RequestHandler = async ({ platform, locals }) => {
	if (!platform?.env?.SESSIONS) {
		return new Response('Service unavailable', { status: 503 });
	}

	const clientId = platform.env.GOOGLE_CLIENT_ID;
	const redirectUri = platform.env.GOOGLE_REDIRECT_URI;

	if (!clientId || !redirectUri) {
		return new Response(
			JSON.stringify({ error: { code: 'NOT_CONFIGURED', message: 'Google Login 尚未設定' } }),
			{ status: 503, headers: { 'Content-Type': 'application/json' } }
		);
	}

	const state = crypto.randomUUID();
	const kv = platform.env.SESSIONS;

	const stateData = JSON.stringify({
		userId: locals.user?.id || null,
		createdAt: new Date().toISOString()
	});
	await kv.put(`google_state:${state}`, stateData, { expirationTtl: 300 });

	const authUrl = getGoogleAuthUrl(clientId, redirectUri, state);
	throw redirect(302, authUrl);
};
