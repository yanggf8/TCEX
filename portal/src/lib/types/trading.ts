export interface Product {
	id: string;
	type: string;
	nameZh: string;
	nameEn: string;
	descriptionZh: string | null;
	descriptionEn: string | null;
	icon: string | null;
	displayOrder: number;
	status: string;
	createdAt: string;
	updatedAt: string;
}

export interface Listing {
	id: string;
	productId: string;
	productType: string;
	symbol: string;
	nameZh: string;
	nameEn: string;
	descriptionZh: string | null;
	descriptionEn: string | null;
	unitPrice: string;
	totalUnits: string;
	availableUnits: string;
	yieldRate: string | null;
	riskLevel: string;
	status: string;
	listedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface ListingSummary {
	id: string;
	symbol: string;
	nameZh: string;
	nameEn: string;
	productType: string;
	unitPrice: string;
	yieldRate: string | null;
	riskLevel: string;
	status: string;
}

export interface PaginatedResponse<T> {
	data: T[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export interface WalletSummary {
	availableBalance: string;
	lockedBalance: string;
}

export interface DashboardStats {
	portfolioValue: string;
	availableBalance: string;
	positionCount: number;
	watchlistCount: number;
}
