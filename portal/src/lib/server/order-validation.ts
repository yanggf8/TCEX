import { isValidAmount, isPositive, gte, multiply, subtract, add } from '$lib/utils/decimal';

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

/**
 * Atomically lock funds for a buy order using optimistic concurrency.
 * Uses conditional UPDATE with WHERE available_balance = ? to prevent
 * race conditions where concurrent requests could overspend.
 */
export async function lockFundsForBuy(
	db: D1Database,
	userId: string,
	amount: string
): Promise<{ success: boolean }> {
	const timestamp = new Date().toISOString();

	// Read current balance
	const wallet = await db
		.prepare('SELECT available_balance, locked_balance FROM wallets WHERE user_id = ?')
		.bind(userId)
		.first<{ available_balance: string; locked_balance: string }>();

	if (!wallet || !gte(wallet.available_balance, amount)) {
		return { success: false };
	}

	const newAvailable = subtract(wallet.available_balance, amount);
	const newLocked = add(wallet.locked_balance, amount);

	// Conditional update: only succeeds if available_balance hasn't changed since we read it
	const result = await db
		.prepare(
			`UPDATE wallets SET
			   available_balance = ?,
			   locked_balance = ?,
			   updated_at = ?
			 WHERE user_id = ? AND available_balance = ?`
		)
		.bind(newAvailable, newLocked, timestamp, userId, wallet.available_balance)
		.run();

	// If no rows were updated, another concurrent request modified the balance
	if (!result.meta.changes || result.meta.changes === 0) {
		return { success: false };
	}

	return { success: true };
}

/**
 * Unlock previously locked funds (e.g., on order cancellation, engine failure,
 * or price improvement refund). Uses optimistic concurrency on locked_balance.
 */
export async function unlockFunds(
	db: D1Database,
	userId: string,
	amount: string
): Promise<void> {
	const wallet = await db
		.prepare('SELECT available_balance, locked_balance FROM wallets WHERE user_id = ?')
		.bind(userId)
		.first<{ available_balance: string; locked_balance: string }>();

	if (!wallet) return;

	const newAvailable = add(wallet.available_balance, amount);
	const newLocked = subtract(wallet.locked_balance, amount);
	const timestamp = new Date().toISOString();

	// Conditional update on locked_balance to prevent lost updates from concurrent unlocks
	await db
		.prepare(
			`UPDATE wallets SET
			   available_balance = ?,
			   locked_balance = ?,
			   updated_at = ?
			 WHERE user_id = ? AND locked_balance = ?`
		)
		.bind(newAvailable, newLocked, timestamp, userId, wallet.locked_balance)
		.run();
}
