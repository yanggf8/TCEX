import { isValidAmount, isPositive, gte, gt, multiply, subtract, compare } from '$lib/utils/decimal';

export interface OrderValidation {
	valid: boolean;
	error?: string;
}

export interface PreTradeCheck {
	listingId: string;
	side: 'buy' | 'sell';
	price: string;
	quantity: string;
	userId: string;
}

export async function validateOrder(db: D1Database, check: PreTradeCheck): Promise<OrderValidation> {
	// Basic validation
	if (!isValidAmount(check.price) || !isPositive(check.price)) {
		return { valid: false, error: 'invalid_price' };
	}
	if (!isValidAmount(check.quantity) || !isPositive(check.quantity)) {
		return { valid: false, error: 'invalid_quantity' };
	}

	// Check listing exists and is active
	const listing = await db
		.prepare('SELECT id, unit_price, status FROM listings WHERE id = ?')
		.bind(check.listingId)
		.first<{ id: string; unit_price: string; status: string }>();

	if (!listing) {
		return { valid: false, error: 'listing_not_found' };
	}
	if (listing.status !== 'active') {
		return { valid: false, error: 'listing_not_active' };
	}

	// Circuit breaker: price within ±10% of unit_price
	const refPrice = parseFloat(listing.unit_price);
	const orderPrice = parseFloat(check.price);
	const lowerBound = refPrice * 0.9;
	const upperBound = refPrice * 1.1;

	if (orderPrice < lowerBound || orderPrice > upperBound) {
		return { valid: false, error: 'price_out_of_range' };
	}

	if (check.side === 'buy') {
		// Check wallet balance
		const wallet = await db
			.prepare('SELECT available_balance FROM wallets WHERE user_id = ?')
			.bind(check.userId)
			.first<{ available_balance: string }>();

		if (!wallet) {
			return { valid: false, error: 'wallet_not_found' };
		}

		const requiredFunds = multiply(check.quantity, check.price);
		if (!gte(wallet.available_balance, requiredFunds)) {
			return { valid: false, error: 'insufficient_balance' };
		}
	} else {
		// Check position for sell
		const position = await db
			.prepare('SELECT quantity FROM positions WHERE id = ?')
			.bind(`${check.userId}-${check.listingId}`)
			.first<{ quantity: string }>();

		if (!position || !gte(position.quantity, check.quantity)) {
			return { valid: false, error: 'insufficient_position' };
		}
	}

	return { valid: true };
}

export async function lockFundsForBuy(db: D1Database, userId: string, amount: string): Promise<void> {
	const timestamp = new Date().toISOString();
	await db
		.prepare(
			`UPDATE wallets SET
			   available_balance = CAST(CAST(available_balance AS REAL) - CAST(? AS REAL) AS TEXT),
			   locked_balance = CAST(CAST(locked_balance AS REAL) + CAST(? AS REAL) AS TEXT),
			   updated_at = ?
			 WHERE user_id = ?`
		)
		.bind(amount, amount, timestamp, userId)
		.run();
}
