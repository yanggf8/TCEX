import { SignJWT, jwtVerify } from 'jose';

const JWT_ISSUER = 'tcex';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface JWTPayload {
	sub: string;
	email: string;
	displayName: string | null;
	kycLevel: number;
	emailVerified: boolean;
	totpEnabled: boolean;
	type: 'access' | 'refresh' | 'login_2fa';
}

function getJwtSecret(secret: string): Uint8Array {
	return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(password),
		'PBKDF2',
		false,
		['deriveBits']
	);
	const hash = await crypto.subtle.deriveBits(
		{ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
		keyMaterial,
		256
	);
	const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
	const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
	return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
	const [saltHex, hashHex] = stored.split(':');
	const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(password),
		'PBKDF2',
		false,
		['deriveBits']
	);
	const hash = await crypto.subtle.deriveBits(
		{ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
		keyMaterial,
		256
	);
	const computedHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
	return computedHex === hashHex;
}

export async function createAccessToken(payload: Omit<JWTPayload, 'type'>, jwtSecret: string): Promise<string> {
	return new SignJWT({ ...payload, type: 'access' as const })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuer(JWT_ISSUER)
		.setIssuedAt()
		.setExpirationTime(ACCESS_TOKEN_EXPIRY)
		.sign(getJwtSecret(jwtSecret));
}

export async function createRefreshToken(payload: Omit<JWTPayload, 'type'>, jwtSecret: string): Promise<string> {
	return new SignJWT({ ...payload, type: 'refresh' as const })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuer(JWT_ISSUER)
		.setIssuedAt()
		.setExpirationTime(REFRESH_TOKEN_EXPIRY)
		.sign(getJwtSecret(jwtSecret));
}

export async function createLogin2faToken(payload: Omit<JWTPayload, 'type'>, jwtSecret: string): Promise<string> {
	return new SignJWT({ ...payload, type: 'login_2fa' as const })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuer(JWT_ISSUER)
		.setIssuedAt()
		.setExpirationTime('5m')
		.sign(getJwtSecret(jwtSecret));
}

export async function verifyToken(token: string, jwtSecret: string): Promise<JWTPayload | null> {
	try {
		const { payload } = await jwtVerify(token, getJwtSecret(jwtSecret), { issuer: JWT_ISSUER });
		return payload as unknown as JWTPayload;
	} catch {
		return null;
	}
}

export function generateId(): string {
	return crypto.randomUUID();
}

export function validateEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string): string | null {
	if (password.length < 12) return 'Password must be at least 12 characters';
	if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter';
	if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
	if (!/[0-9]/.test(password)) return 'Password must contain a number';
	if (!/[^a-zA-Z0-9]/.test(password)) return 'Password must contain a special character';
	return null;
}
