/**
 * TEXT-based decimal arithmetic for financial calculations.
 * Shared with portal — keep in sync.
 */

function normalize(value: string): string {
	const trimmed = value.trim();
	if (trimmed === '' || trimmed === '-') return '0';
	const match = trimmed.match(/^(-?\d+)(?:\.(\d+))?$/);
	if (!match) throw new Error(`Invalid decimal value: ${value}`);
	const sign = match[1].startsWith('-') ? '-' : '';
	const intPart = match[1].replace('-', '').replace(/^0+/, '') || '0';
	const fracPart = match[2] ? match[2].replace(/0+$/, '') : '';
	const result = fracPart ? `${intPart}.${fracPart}` : intPart;
	if (sign === '-' && result === '0') return '0';
	return sign + result;
}

function toScaled(value: string): bigint {
	const n = normalize(value);
	const sign = n.startsWith('-') ? -1n : 1n;
	const abs = n.replace('-', '');
	const [intStr, fracStr = ''] = abs.split('.');
	const frac = fracStr.padEnd(2, '0').slice(0, 2);
	return sign * (BigInt(intStr) * 100n + BigInt(frac));
}

function fromScaled(scaled: bigint): string {
	const sign = scaled < 0n ? '-' : '';
	const abs = scaled < 0n ? -scaled : scaled;
	const intPart = abs / 100n;
	const fracPart = (abs % 100n).toString().padStart(2, '0');
	const trimmedFrac = fracPart.replace(/0+$/, '');
	return sign + (trimmedFrac ? `${intPart}.${trimmedFrac}` : intPart.toString());
}

export function add(a: string, b: string): string {
	return fromScaled(toScaled(a) + toScaled(b));
}

export function subtract(a: string, b: string): string {
	return fromScaled(toScaled(a) - toScaled(b));
}

export function multiply(a: string, b: string): string {
	return fromScaled((toScaled(a) * toScaled(b)) / 100n);
}

export function compare(a: string, b: string): number {
	const diff = toScaled(a) - toScaled(b);
	if (diff > 0n) return 1;
	if (diff < 0n) return -1;
	return 0;
}

export function gte(a: string, b: string): boolean { return compare(a, b) >= 0; }
export function gt(a: string, b: string): boolean { return compare(a, b) > 0; }
export function lt(a: string, b: string): boolean { return compare(a, b) < 0; }
export function isPositive(value: string): boolean { return toScaled(value) > 0n; }
export function isZero(value: string): boolean { return toScaled(value) === 0n; }
export function min(a: string, b: string): string { return lt(a, b) ? a : b; }

export const ZERO = '0';
