export type OrderSide = 'buy' | 'sell';
export type OrderType = 'limit' | 'market';
export type OrderStatus = 'pending' | 'partial' | 'filled' | 'cancelled';

export interface Order {
	id: string;
	userId: string;
	listingId: string;
	side: OrderSide;
	type: OrderType;
	status: OrderStatus;
	price: string | null;
	quantity: string;
	filledQuantity: string;
	remainingQuantity: string;
	createdAt: string;
	updatedAt: string;
	filledAt: string | null;
	cancelledAt: string | null;
}

export interface OrderWithListing extends Order {
	listingSymbol: string;
	listingNameZh: string;
	listingNameEn: string;
}

export interface OrderSummary {
	activeCount: number;
	filledCount: number;
	cancelledCount: number;
}
