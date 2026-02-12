import { TOTP, Secret } from 'otpauth';

const ISSUER = 'TCEX';

export function generateTotpSecret(email: string): { secret: string; uri: string } {
	const secret = new Secret({ size: 20 });
	const totp = new TOTP({
		issuer: ISSUER,
		label: email,
		algorithm: 'SHA1',
		digits: 6,
		period: 30,
		secret
	});
	return {
		secret: secret.base32,
		uri: totp.toString()
	};
}

export function verifyTotpCode(secretBase32: string, code: string): boolean {
	const totp = new TOTP({
		issuer: ISSUER,
		algorithm: 'SHA1',
		digits: 6,
		period: 30,
		secret: Secret.fromBase32(secretBase32)
	});
	// Allow 1 period window (±30s)
	const delta = totp.validate({ token: code, window: 1 });
	return delta !== null;
}

export function generateBackupCodes(count: number = 10): string[] {
	const codes: string[] = [];
	for (let i = 0; i < count; i++) {
		const bytes = crypto.getRandomValues(new Uint8Array(4));
		const code = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
		codes.push(code);
	}
	return codes;
}
