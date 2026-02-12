import { json } from '@sveltejs/kit';

export function errorResponse(code: string, message: string, status: number) {
	return json({ error: { code, message } }, { status });
}

export function unauthorized() {
	return errorResponse('UNAUTHORIZED', '請先登入', 401);
}

export function serviceUnavailable() {
	return errorResponse('SERVICE_UNAVAILABLE', '服務暫時無法使用', 503);
}
