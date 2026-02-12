import type { Handle, HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

/**
 * Security headers middleware
 */
const securityHeaders: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	// Content Security Policy
	response.headers.set(
		'Content-Security-Policy',
		[
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline'", // Will tighten in production with nonce
			"style-src 'self' 'unsafe-inline'",
			"img-src 'self' data: https:",
			"font-src 'self'",
			"connect-src 'self' https://api.tcex.tw wss://api.tcex.tw",
			"frame-ancestors 'none'",
			"base-uri 'self'",
			"form-action 'self'"
		].join('; ')
	);

	// Other security headers
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

	return response;
};

/**
 * Authentication guard for protected routes
 * TODO: Implement in Phase 2 with actual auth
 */
const authGuard: Handle = async ({ event, resolve }) => {
	const protectedPaths = ['/dashboard', '/wallet', '/orders', '/settings'];
	const isProtected = protectedPaths.some((path) => event.url.pathname.startsWith(path));

	if (isProtected) {
		// TODO: Check for valid session/JWT
		// const session = event.cookies.get('session');
		// if (!session) {
		// 	throw redirect(303, '/login?redirect=' + encodeURIComponent(event.url.pathname));
		// }
		// event.locals.user = await validateSession(session);
	}

	return resolve(event);
};

/**
 * Request logging (for audit trail)
 */
const requestLogger: Handle = async ({ event, resolve }) => {
	const start = Date.now();
	const response = await resolve(event);
	const duration = Date.now() - start;

	// TODO: Send to audit log service in production
	if (import.meta.env.DEV) {
		console.log(`${event.request.method} ${event.url.pathname} - ${response.status} (${duration}ms)`);
	}

	return response;
};

export const handle = sequence(securityHeaders, authGuard, requestLogger);

/**
 * Global error handler
 */
export const handleError: HandleServerError = async ({ error, event }) => {
	// TODO: Send to error tracking service (e.g., Sentry)
	console.error('Server error:', error);

	return {
		message: '發生錯誤，請稍後再試',
		code: 'INTERNAL_ERROR'
	};
};
