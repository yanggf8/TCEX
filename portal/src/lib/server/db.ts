import type { Product, Listing, ListingSummary } from '$lib/types/trading';
import type { Wallet, WalletTransaction, WalletTransactionType } from '$lib/types/wallet';
import type { Order, OrderWithListing, OrderSide, OrderType, OrderStatus } from '$lib/types/order';
import type { Position, PositionWithListing } from '$lib/types/portfolio';
import type { EmailVerification } from '$lib/types/auth';
import type { KycApplication, KycDocument, KycStatus } from '$lib/types/kyc';

interface ProductRow {
	id: string;
	type: string;
	name_zh: string;
	name_en: string;
	description_zh: string | null;
	description_en: string | null;
	icon: string | null;
	display_order: number;
	status: string;
	created_at: string;
	updated_at: string;
}

interface ListingRow {
	id: string;
	product_id: string;
	product_type: string;
	symbol: string;
	name_zh: string;
	name_en: string;
	description_zh: string | null;
	description_en: string | null;
	unit_price: string;
	total_units: string;
	available_units: string;
	yield_rate: string | null;
	risk_level: string;
	status: string;
	listed_at: string | null;
	created_at: string;
	updated_at: string;
}

export function mapProductRow(row: ProductRow): Product {
	return {
		id: row.id,
		type: row.type,
		nameZh: row.name_zh,
		nameEn: row.name_en,
		descriptionZh: row.description_zh,
		descriptionEn: row.description_en,
		icon: row.icon,
		displayOrder: row.display_order,
		status: row.status,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	};
}

export function mapListingRow(row: ListingRow): Listing {
	return {
		id: row.id,
		productId: row.product_id,
		productType: row.product_type,
		symbol: row.symbol,
		nameZh: row.name_zh,
		nameEn: row.name_en,
		descriptionZh: row.description_zh,
		descriptionEn: row.description_en,
		unitPrice: row.unit_price,
		totalUnits: row.total_units,
		availableUnits: row.available_units,
		yieldRate: row.yield_rate,
		riskLevel: row.risk_level,
		status: row.status,
		listedAt: row.listed_at,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	};
}

export function mapListingSummaryRow(row: ListingRow): ListingSummary {
	return {
		id: row.id,
		symbol: row.symbol,
		nameZh: row.name_zh,
		nameEn: row.name_en,
		productType: row.product_type,
		unitPrice: row.unit_price,
		yieldRate: row.yield_rate,
		riskLevel: row.risk_level,
		status: row.status
	};
}

interface WalletRow {
	id: string;
	user_id: string;
	currency: string;
	available_balance: string;
	locked_balance: string;
	total_deposited: string;
	total_withdrawn: string;
	created_at: string;
	updated_at: string;
}

interface WalletTransactionRow {
	id: string;
	wallet_id: string;
	user_id: string;
	type: string;
	amount: string;
	fee: string;
	balance_before: string;
	balance_after: string;
	reference_type: string | null;
	reference_id: string | null;
	description: string | null;
	status: string;
	created_at: string;
}

export function mapWalletRow(row: WalletRow): Wallet {
	return {
		id: row.id,
		userId: row.user_id,
		currency: row.currency,
		availableBalance: row.available_balance,
		lockedBalance: row.locked_balance,
		totalDeposited: row.total_deposited,
		totalWithdrawn: row.total_withdrawn,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	};
}

export function mapWalletTransactionRow(row: WalletTransactionRow): WalletTransaction {
	return {
		id: row.id,
		walletId: row.wallet_id,
		userId: row.user_id,
		type: row.type as WalletTransactionType,
		amount: row.amount,
		fee: row.fee,
		balanceBefore: row.balance_before,
		balanceAfter: row.balance_after,
		referenceType: row.reference_type,
		referenceId: row.reference_id,
		description: row.description,
		status: row.status,
		createdAt: row.created_at
	};
}

interface OrderRow {
	id: string;
	user_id: string;
	listing_id: string;
	side: string;
	type: string;
	status: string;
	price: string | null;
	quantity: string;
	filled_quantity: string;
	remaining_quantity: string;
	created_at: string;
	updated_at: string;
	filled_at: string | null;
	cancelled_at: string | null;
}

interface OrderWithListingRow extends OrderRow {
	listing_symbol: string;
	listing_name_zh: string;
	listing_name_en: string;
}

export function mapOrderRow(row: OrderRow): Order {
	return {
		id: row.id,
		userId: row.user_id,
		listingId: row.listing_id,
		side: row.side as OrderSide,
		type: row.type as OrderType,
		status: row.status as OrderStatus,
		price: row.price,
		quantity: row.quantity,
		filledQuantity: row.filled_quantity,
		remainingQuantity: row.remaining_quantity,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
		filledAt: row.filled_at,
		cancelledAt: row.cancelled_at
	};
}

export function mapOrderWithListingRow(row: OrderWithListingRow): OrderWithListing {
	return {
		...mapOrderRow(row),
		listingSymbol: row.listing_symbol,
		listingNameZh: row.listing_name_zh,
		listingNameEn: row.listing_name_en
	};
}

interface PositionRow {
	id: string;
	user_id: string;
	listing_id: string;
	quantity: string;
	average_cost: string;
	realized_pnl: string;
	created_at: string;
	updated_at: string;
}

interface PositionWithListingRow extends PositionRow {
	listing_symbol: string;
	listing_name_zh: string;
	listing_name_en: string;
	listing_unit_price: string;
	listing_product_type: string;
}

export function mapPositionRow(row: PositionRow): Position {
	return {
		id: row.id,
		userId: row.user_id,
		listingId: row.listing_id,
		quantity: row.quantity,
		averageCost: row.average_cost,
		realizedPnl: row.realized_pnl,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	};
}

export function mapPositionWithListingRow(row: PositionWithListingRow): PositionWithListing {
	return {
		...mapPositionRow(row),
		listingSymbol: row.listing_symbol,
		listingNameZh: row.listing_name_zh,
		listingNameEn: row.listing_name_en,
		listingUnitPrice: row.listing_unit_price,
		listingProductType: row.listing_product_type
	};
}

export interface WatchlistItem {
	id: string;
	userId: string;
	listingId: string;
	createdAt: string;
	listingSymbol: string;
	listingNameZh: string;
	listingNameEn: string;
	listingUnitPrice: string;
	listingProductType: string;
	listingYieldRate: string | null;
	listingRiskLevel: string;
	listingStatus: string;
}

interface WatchlistItemRow {
	id: string;
	user_id: string;
	listing_id: string;
	created_at: string;
	listing_symbol: string;
	listing_name_zh: string;
	listing_name_en: string;
	listing_unit_price: string;
	listing_product_type: string;
	listing_yield_rate: string | null;
	listing_risk_level: string;
	listing_status: string;
}

export function mapWatchlistItemRow(row: WatchlistItemRow): WatchlistItem {
	return {
		id: row.id,
		userId: row.user_id,
		listingId: row.listing_id,
		createdAt: row.created_at,
		listingSymbol: row.listing_symbol,
		listingNameZh: row.listing_name_zh,
		listingNameEn: row.listing_name_en,
		listingUnitPrice: row.listing_unit_price,
		listingProductType: row.listing_product_type,
		listingYieldRate: row.listing_yield_rate,
		listingRiskLevel: row.listing_risk_level,
		listingStatus: row.listing_status
	};
}

// Email verification mapper
interface EmailVerificationRow {
	id: string;
	user_id: string;
	code: string;
	expires_at: string;
	used: number;
	created_at: string;
}

export function mapEmailVerificationRow(row: EmailVerificationRow): EmailVerification {
	return {
		id: row.id,
		userId: row.user_id,
		code: row.code,
		expiresAt: row.expires_at,
		used: !!(row.used),
		createdAt: row.created_at
	};
}

// KYC application mapper
interface KycApplicationRow {
	id: string;
	user_id: string;
	level: number;
	status: string;
	reviewer_notes: string | null;
	created_at: string;
	updated_at: string;
}

export function mapKycApplicationRow(row: KycApplicationRow): KycApplication {
	return {
		id: row.id,
		userId: row.user_id,
		level: row.level,
		status: row.status as KycStatus,
		reviewerNotes: row.reviewer_notes,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	};
}

// KYC document mapper
interface KycDocumentRow {
	id: string;
	user_id: string;
	application_id: string;
	document_type: string;
	r2_key: string;
	file_name: string;
	content_type: string;
	file_size: number;
	created_at: string;
}

export function mapKycDocumentRow(row: KycDocumentRow): KycDocument {
	return {
		id: row.id,
		userId: row.user_id,
		applicationId: row.application_id,
		documentType: row.document_type,
		r2Key: row.r2_key,
		fileName: row.file_name,
		contentType: row.content_type,
		fileSize: row.file_size,
		createdAt: row.created_at
	};
}

// LINE account mapper
export interface LineAccount {
	id: string;
	userId: string;
	lineUserId: string;
	displayName: string | null;
	pictureUrl: string | null;
	createdAt: string;
	updatedAt: string;
}

interface LineAccountRow {
	id: string;
	user_id: string;
	line_user_id: string;
	display_name: string | null;
	picture_url: string | null;
	created_at: string;
	updated_at: string;
}

export function mapLineAccountRow(row: LineAccountRow): LineAccount {
	return {
		id: row.id,
		userId: row.user_id,
		lineUserId: row.line_user_id,
		displayName: row.display_name,
		pictureUrl: row.picture_url,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	};
}
