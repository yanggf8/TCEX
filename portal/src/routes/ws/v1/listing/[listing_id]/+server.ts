import type { RequestHandler } from './$types';

/**
 * WebSocket proxy: forwards upgrade requests from the portal to the ENGINE
 * service binding (tcex-engine Durable Object).
 *
 * Frontend connects to: wss://{portal-host}/ws/v1/listing/{listing_id}
 * Engine handles:       /ws/v1/listing/{listing_id} → MatchingEngine DO
 */
export const GET: RequestHandler = async ({ params, request, platform }) => {
	if (!platform?.env?.ENGINE) {
		return new Response('Service unavailable', { status: 503 });
	}

	const upgradeHeader = request.headers.get('Upgrade');
	if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
		return new Response('Expected WebSocket upgrade', { status: 426 });
	}

	return platform.env.ENGINE.fetch(
		`https://tcex-engine/ws/v1/listing/${params.listing_id}`,
		{ method: 'GET', headers: request.headers }
	);
};
