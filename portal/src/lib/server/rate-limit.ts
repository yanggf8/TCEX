export async function checkRateLimit(
	kv: KVNamespace,
	key: string,
	windowSeconds: number
): Promise<boolean> {
	const rateLimitKey = `ratelimit:${key}`;
	const existing = await kv.get(rateLimitKey);
	if (existing) {
		return false;
	}
	await kv.put(rateLimitKey, '1', { expirationTtl: windowSeconds });
	return true;
}
