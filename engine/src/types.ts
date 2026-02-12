export interface OrderRequest {
	id: string;
	userId: string;
	listingId: string;
	side: 'buy' | 'sell';
	type: 'limit';
	price: string;
	quantity: string;
}

export interface OrderEntry {
	id: string;
	userId: string;
	side: 'buy' | 'sell';
	price: string;
	quantity: string;
	remainingQuantity: string;
	createdAt: string;
}

export interface Trade {
	id: string;
	listingId: string;
	buyOrderId: string;
	sellOrderId: string;
	buyerId: string;
	sellerId: string;
	price: string;
	quantity: string;
	total: string;
	createdAt: string;
}

export interface PriceLevel {
	price: string;
	quantity: string;
	orderCount: number;
}

export interface OrderBookSnapshot {
	bids: PriceLevel[];
	asks: PriceLevel[];
	lastTradePrice: string | null;
	lastTradeTime: string | null;
}

export interface MatchResult {
	trades: Trade[];
	remainingOrder: OrderEntry | null;
	status: 'filled' | 'partial' | 'pending';
}

export interface Env {
	DB: D1Database;
	MATCHING_ENGINE: DurableObjectNamespace;
}
