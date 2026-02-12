export interface Position {
	id: string;
	userId: string;
	listingId: string;
	quantity: string;
	averageCost: string;
	realizedPnl: string;
	createdAt: string;
	updatedAt: string;
}

export interface PositionWithListing extends Position {
	listingSymbol: string;
	listingNameZh: string;
	listingNameEn: string;
	listingUnitPrice: string;
	listingProductType: string;
}

export interface PortfolioSummary {
	totalValue: string;
	totalCost: string;
	totalRealizedPnl: string;
	positionCount: number;
}
