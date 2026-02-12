import type { Handle, HandleServerError } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { verifyToken } from '$lib/server/auth';

const DEV_JWT_SECRET = 'tcex-dev-jwt-secret-do-not-use-in-production';

function getJwtSecret(platform: App.Platform | undefined): string {
	return platform?.env?.JWT_SECRET || DEV_JWT_SECRET;
}

const securityHeaders: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	response.headers.set(
		'Content-Security-Policy',
		[
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline'",
			"style-src 'self' 'unsafe-inline'",
			"img-src 'self' data: https:",
			"font-src 'self'",
			"connect-src 'self' wss: ws: https://access.line.me https://api.line.me",
			"frame-ancestors 'none'",
			"base-uri 'self'",
			"form-action 'self'"
		].join('; ')
	);

	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

	return response;
};

const authGuard: Handle = async ({ event, resolve }) => {
	// Default: no user
	event.locals.user = null;

	// Extract access token from Authorization header or cookie
	const authHeader = event.request.headers.get('Authorization');
	const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

	if (accessToken) {
		const jwtSecret = getJwtSecret(event.platform);
		const payload = await verifyToken(accessToken, jwtSecret);
		if (payload && payload.type === 'access') {
			event.locals.user = {
				id: payload.sub,
				email: payload.email,
				displayName: payload.displayName,
				kycLevel: payload.kycLevel,
				emailVerified: payload.emailVerified ?? false,
				totpEnabled: payload.totpEnabled ?? false
			};
		}
	}

	// Protected route check
	const protectedPaths = ['/dashboard', '/wallet', '/orders', '/settings'];
	const isProtected = protectedPaths.some((path) => event.url.pathname.startsWith(path));

	if (isProtected && !event.locals.user) {
		throw redirect(303, '/login?redirect=' + encodeURIComponent(event.url.pathname));
	}

	return resolve(event);
};

const requestLogger: Handle = async ({ event, resolve }) => {
	const start = Date.now();
	const response = await resolve(event);
	const duration = Date.now() - start;

	if (import.meta.env.DEV) {
		console.log(`${event.request.method} ${event.url.pathname} - ${response.status} (${duration}ms)`);
	}

	return response;
};

export const handle = sequence(securityHeaders, authGuard, requestLogger);

export const handleError: HandleServerError = async ({ error }) => {
	console.error('Server error:', error);

	return {
		message: '發生錯誤，請稍後再試',
		code: 'INTERNAL_ERROR'
	};
};
