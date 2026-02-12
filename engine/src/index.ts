import type { Env } from './types';

export { MatchingEngine } from './matching-engine';

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		// Health check
		if (path === '/health') {
			return Response.json({ status: 'ok', service: 'tcex-engine' });
		}

		// Route: /v1/listing/{listingId}/order
		// Route: /v1/listing/{listingId}/order/{orderId}
		// Route: /v1/listing/{listingId}/orderbook
		// Route: /ws/v1/listing/{listingId}
		const wsMatch = path.match(/^\/ws\/v1\/listing\/([^/]+)$/);
		if (wsMatch) {
			const [, listingId] = wsMatch;
			const doId = env.MATCHING_ENGINE.idFromName(listingId);
			const stub = env.MATCHING_ENGINE.get(doId);
			const doRequest = new Request(`https://do-internal/ws`, {
				method: request.method,
				headers: new Headers({
					...Object.fromEntries(request.headers.entries()),
					'X-Listing-Id': listingId
				})
			});
			return stub.fetch(doRequest);
		}

		const match = path.match(/^\/v1\/listing\/([^/]+)\/(order|orderbook)(?:\/([^/]+))?$/);

		if (!match) {
			return Response.json({ error: 'Not found' }, { status: 404 });
		}

		const [, listingId, resource, resourceId] = match;

		// Get DO stub keyed by listing ID
		const doId = env.MATCHING_ENGINE.idFromName(listingId);
		const stub = env.MATCHING_ENGINE.get(doId);

		// Build internal path for the DO
		let doPath = `/${resource}`;
		if (resourceId) doPath += `/${resourceId}`;
		doPath += url.search;

		// Forward request to DO with listing ID header
		const doRequest = new Request(`https://do-internal${doPath}`, {
			method: request.method,
			headers: new Headers({
				...Object.fromEntries(request.headers.entries()),
				'X-Listing-Id': listingId
			}),
			body: request.body
		});

		return stub.fetch(doRequest);
	}
};
