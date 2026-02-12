import type { Wallet, WalletTransaction } from '$lib/types/wallet';
import { add, subtract, isValidAmount, isPositive, gte, ZERO, MAX_DEPOSIT, MIN_DEPOSIT, MIN_WITHDRAW } from '$lib/utils/decimal';
import { mapWalletRow, mapWalletTransactionRow } from '$lib/server/db';

function generateId(): string {
	return crypto.randomUUID();
}

function now(): string {
	return new Date().toISOString();
}

export async function getOrCreateWallet(db: D1Database, userId: string): Promise<Wallet> {
	const existing = await db
		.prepare('SELECT * FROM wallets WHERE user_id = ?')
		.bind(userId)
		.first();

	if (existing) {
		return mapWalletRow(existing as any);
	}

	const id = generateId();
	const timestamp = now();
	await db
		.prepare(
			`INSERT INTO wallets (id, user_id, currency, available_balance, locked_balance, total_deposited, total_withdrawn, created_at, updated_at)
			 VALUES (?, ?, 'TWD', '0', '0', '0', '0', ?, ?)`
		)
		.bind(id, userId, timestamp, timestamp)
		.run();

	return {
		id,
		userId,
		currency: 'TWD',
		availableBalance: ZERO,
		lockedBalance: ZERO,
		totalDeposited: ZERO,
		totalWithdrawn: ZERO,
		createdAt: timestamp,
		updatedAt: timestamp
	};
}

export interface DepositResult {
	success: boolean;
	error?: string;
	wallet?: Wallet;
	transaction?: WalletTransaction;
}

export async function deposit(db: D1Database, userId: string, amount: string): Promise<DepositResult> {
	if (!isValidAmount(amount)) {
		return { success: false, error: 'invalid_amount' };
	}
	if (!isPositive(amount)) {
		return { success: false, error: 'amount_must_be_positive' };
	}
	if (!gte(amount, MIN_DEPOSIT)) {
		return { success: false, error: 'amount_below_minimum' };
	}
	if (!gte(MAX_DEPOSIT, amount)) {
		return { success: false, error: 'amount_exceeds_maximum' };
	}

	const wallet = await getOrCreateWallet(db, userId);
	const newBalance = add(wallet.availableBalance, amount);
	const newTotalDeposited = add(wallet.totalDeposited, amount);
	const txId = generateId();
	const timestamp = now();

	const updateWallet = db
		.prepare(
			`UPDATE wallets SET available_balance = ?, total_deposited = ?, updated_at = ? WHERE id = ?`
		)
		.bind(newBalance, newTotalDeposited, timestamp, wallet.id);

	const insertTx = db
		.prepare(
			`INSERT INTO wallet_transactions (id, wallet_id, user_id, type, amount, fee, balance_before, balance_after, reference_type, reference_id, description, status, created_at)
			 VALUES (?, ?, ?, 'deposit', ?, '0', ?, ?, NULL, NULL, ?, 'completed', ?)`
		)
		.bind(txId, wallet.id, userId, amount, wallet.availableBalance, newBalance, 'Deposit', timestamp);

	await db.batch([updateWallet, insertTx]);

	const updatedWallet: Wallet = {
		...wallet,
		availableBalance: newBalance,
		totalDeposited: newTotalDeposited,
		updatedAt: timestamp
	};

	const transaction: WalletTransaction = {
		id: txId,
		walletId: wallet.id,
		userId,
		type: 'deposit',
		amount,
		fee: ZERO,
		balanceBefore: wallet.availableBalance,
		balanceAfter: newBalance,
		referenceType: null,
		referenceId: null,
		description: 'Deposit',
		status: 'completed',
		createdAt: timestamp
	};

	return { success: true, wallet: updatedWallet, transaction };
}

export interface WithdrawResult {
	success: boolean;
	error?: string;
	wallet?: Wallet;
	transaction?: WalletTransaction;
}

export async function withdraw(db: D1Database, userId: string, amount: string): Promise<WithdrawResult> {
	if (!isValidAmount(amount)) {
		return { success: false, error: 'invalid_amount' };
	}
	if (!isPositive(amount)) {
		return { success: false, error: 'amount_must_be_positive' };
	}
	if (!gte(amount, MIN_WITHDRAW)) {
		return { success: false, error: 'amount_below_minimum' };
	}

	const wallet = await getOrCreateWallet(db, userId);

	if (!gte(wallet.availableBalance, amount)) {
		return { success: false, error: 'insufficient_balance' };
	}

	const newBalance = subtract(wallet.availableBalance, amount);
	const newTotalWithdrawn = add(wallet.totalWithdrawn, amount);
	const txId = generateId();
	const timestamp = now();

	// Optimistic concurrency: conditional UPDATE with WHERE available_balance = ?
	// Prevents race conditions where concurrent withdrawals could overspend
	const updateResult = await db
		.prepare(
			`UPDATE wallets SET available_balance = ?, total_withdrawn = ?, updated_at = ?
			 WHERE id = ? AND available_balance = ?`
		)
		.bind(newBalance, newTotalWithdrawn, timestamp, wallet.id, wallet.availableBalance)
		.run();

	// If no rows updated, a concurrent request changed the balance — fail safely
	if (!updateResult.meta.changes || updateResult.meta.changes === 0) {
		return { success: false, error: 'insufficient_balance' };
	}

	// Balance updated successfully — now record the transaction
	await db
		.prepare(
			`INSERT INTO wallet_transactions (id, wallet_id, user_id, type, amount, fee, balance_before, balance_after, reference_type, reference_id, description, status, created_at)
			 VALUES (?, ?, ?, 'withdrawal', ?, '0', ?, ?, NULL, NULL, ?, 'completed', ?)`
		)
		.bind(txId, wallet.id, userId, amount, wallet.availableBalance, newBalance, 'Withdrawal', timestamp)
		.run();

	const updatedWallet: Wallet = {
		...wallet,
		availableBalance: newBalance,
		totalWithdrawn: newTotalWithdrawn,
		updatedAt: timestamp
	};

	const transaction: WalletTransaction = {
		id: txId,
		walletId: wallet.id,
		userId,
		type: 'withdrawal',
		amount,
		fee: ZERO,
		balanceBefore: wallet.availableBalance,
		balanceAfter: newBalance,
		referenceType: null,
		referenceId: null,
		description: 'Withdrawal',
		status: 'completed',
		createdAt: timestamp
	};

	return { success: true, wallet: updatedWallet, transaction };
}

export async function getTransactions(
	db: D1Database,
	userId: string,
	page: number = 1,
	limit: number = 20,
	type?: string
): Promise<{ data: WalletTransaction[]; total: number }> {
	const offset = (page - 1) * limit;

	let whereClause = 'WHERE user_id = ?';
	const bindings: (string | number)[] = [userId];

	if (type) {
		whereClause += ' AND type = ?';
		bindings.push(type);
	}

	const countResult = await db
		.prepare(`SELECT COUNT(*) as total FROM wallet_transactions ${whereClause}`)
		.bind(...bindings)
		.first<{ total: number }>();

	const total = countResult?.total ?? 0;

	const { results } = await db
		.prepare(
			`SELECT * FROM wallet_transactions ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
		)
		.bind(...bindings, limit, offset)
		.all();

	const data = results.map((row: any) => mapWalletTransactionRow(row));

	return { data, total };
}
