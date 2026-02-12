export interface Wallet {
	id: string;
	userId: string;
	currency: string;
	availableBalance: string;
	lockedBalance: string;
	totalDeposited: string;
	totalWithdrawn: string;
	createdAt: string;
	updatedAt: string;
}

export interface WalletTransaction {
	id: string;
	walletId: string;
	userId: string;
	type: WalletTransactionType;
	amount: string;
	fee: string;
	balanceBefore: string;
	balanceAfter: string;
	referenceType: string | null;
	referenceId: string | null;
	description: string | null;
	status: string;
	createdAt: string;
}

export type WalletTransactionType = 'deposit' | 'withdrawal' | 'trade_buy' | 'trade_sell' | 'fee' | 'lock' | 'unlock';

export interface DepositRequest {
	amount: string;
}

export interface WithdrawRequest {
	amount: string;
}

export interface WalletBalanceResponse {
	wallet: Wallet;
}

export interface WalletTransactionsResponse {
	data: WalletTransaction[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}
