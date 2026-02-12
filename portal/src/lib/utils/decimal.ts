/**
 * TEXT-based decimal arithmetic for financial calculations.
 * All values are stored as strings to avoid floating-point precision issues.
 * Supports up to 2 decimal places for TWD currency.
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

function toParts(value: string): { sign: number; int: bigint; frac: bigint; scale: number } {
	const n = normalize(value);
	const sign = n.startsWith('-') ? -1 : 1;
	const abs = n.replace('-', '');
	const [intStr, fracStr = ''] = abs.split('.');
	return {
		sign,
		int: BigInt(intStr),
		frac: BigInt(fracStr.padEnd(2, '0').slice(0, 2)),
		scale: 2
	};
}

function toScaled(value: string): bigint {
	const parts = toParts(value);
	const fracStr = parts.frac.toString().padStart(2, '0');
	return BigInt(parts.sign) * (parts.int * 100n + BigInt(fracStr));
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
	const scaledA = toScaled(a);
	const scaledB = toScaled(b);
	// Both are scaled by 100, so product is scaled by 10000
	// Divide by 100 to get back to scale-2, rounding down
	const product = (scaledA * scaledB) / 100n;
	return fromScaled(product);
}

export function compare(a: string, b: string): number {
	const diff = toScaled(a) - toScaled(b);
	if (diff > 0n) return 1;
	if (diff < 0n) return -1;
	return 0;
}

export function isPositive(value: string): boolean {
	return toScaled(value) > 0n;
}

export function isZero(value: string): boolean {
	return toScaled(value) === 0n;
}

export function isNonNegative(value: string): boolean {
	return toScaled(value) >= 0n;
}

export function gte(a: string, b: string): boolean {
	return compare(a, b) >= 0;
}

export function gt(a: string, b: string): boolean {
	return compare(a, b) > 0;
}

export function lt(a: string, b: string): boolean {
	return compare(a, b) < 0;
}

export function format(value: string, decimals: number = 2): string {
	const n = normalize(value);
	const sign = n.startsWith('-') ? '-' : '';
	const abs = n.replace('-', '');
	const [intPart, fracPart = ''] = abs.split('.');

	const paddedFrac = fracPart.padEnd(decimals, '0').slice(0, decimals);

	// Add thousands separator
	const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

	return decimals > 0 ? `${sign}${withCommas}.${paddedFrac}` : `${sign}${withCommas}`;
}

export function isValidAmount(value: string): boolean {
	return /^\d+(\.\d{1,2})?$/.test(value.trim());
}

export const ZERO = '0';
export const MAX_DEPOSIT = '100000000'; // 100M TWD
export const MIN_DEPOSIT = '100'; // 100 TWD
export const MIN_WITHDRAW = '100'; // 100 TWD
