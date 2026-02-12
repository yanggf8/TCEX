import type { OrderEntry, PriceLevel, OrderBookSnapshot } from './types';
import { compare, subtract, add, isPositive, isZero, min, ZERO } from './decimal';

/**
 * In-memory order book with price-time priority (FIFO at each level).
 * Bids sorted descending (best bid = highest), asks sorted ascending (best ask = lowest).
 */
export class OrderBook {
	private bids: Map<string, OrderEntry[]> = new Map(); // price -> orders (FIFO)
	private asks: Map<string, OrderEntry[]> = new Map();
	private sortedBidPrices: string[] = [];
	private sortedAskPrices: string[] = [];
	public lastTradePrice: string | null = null;
	public lastTradeTime: string | null = null;

	addOrder(order: OrderEntry): void {
		const book = order.side === 'buy' ? this.bids : this.asks;
		const prices = order.side === 'buy' ? this.sortedBidPrices : this.sortedAskPrices;

		if (!book.has(order.price)) {
			book.set(order.price, []);
			prices.push(order.price);
			if (order.side === 'buy') {
				prices.sort((a, b) => compare(b, a)); // descending
			} else {
				prices.sort((a, b) => compare(a, b)); // ascending
			}
		}
		book.get(order.price)!.push({ ...order });
	}

	removeOrder(orderId: string, side: 'buy' | 'sell'): OrderEntry | null {
		const book = side === 'buy' ? this.bids : this.asks;
		const prices = side === 'buy' ? this.sortedBidPrices : this.sortedAskPrices;

		for (const [price, orders] of book.entries()) {
			const idx = orders.findIndex(o => o.id === orderId);
			if (idx !== -1) {
				const removed = orders.splice(idx, 1)[0];
				if (orders.length === 0) {
					book.delete(price);
					const priceIdx = prices.indexOf(price);
					if (priceIdx !== -1) prices.splice(priceIdx, 1);
				}
				return removed;
			}
		}
		return null;
	}

	/**
	 * Match an incoming order against the opposite side.
	 * Returns fills: [{makerOrder, fillQty, fillPrice}]
	 */
	match(incoming: OrderEntry): { fills: Array<{ makerOrder: OrderEntry; fillQuantity: string; fillPrice: string }>; remaining: string } {
		const oppositeBook = incoming.side === 'buy' ? this.asks : this.bids;
		const oppositePrices = incoming.side === 'buy' ? this.sortedAskPrices : this.sortedBidPrices;

		const fills: Array<{ makerOrder: OrderEntry; fillQuantity: string; fillPrice: string }> = [];
		let remaining = incoming.remainingQuantity;

		const pricesToRemove: string[] = [];

		for (const price of oppositePrices) {
			if (isZero(remaining)) break;

			// Price check: buy orders match asks at <= limit price, sell orders match bids at >= limit price
			if (incoming.side === 'buy' && compare(price, incoming.price) > 0) break;
			if (incoming.side === 'sell' && compare(price, incoming.price) < 0) break;

			const orders = oppositeBook.get(price)!;
			const ordersToRemove: number[] = [];

			for (let i = 0; i < orders.length; i++) {
				if (isZero(remaining)) break;

				const maker = orders[i];
				const fillQty = min(remaining, maker.remainingQuantity);

				fills.push({ makerOrder: maker, fillQuantity: fillQty, fillPrice: price });

				maker.remainingQuantity = subtract(maker.remainingQuantity, fillQty);
				remaining = subtract(remaining, fillQty);

				if (isZero(maker.remainingQuantity)) {
					ordersToRemove.push(i);
				}
			}

			// Remove fully filled maker orders (reverse to maintain indices)
			for (let i = ordersToRemove.length - 1; i >= 0; i--) {
				orders.splice(ordersToRemove[i], 1);
			}

			if (orders.length === 0) {
				pricesToRemove.push(price);
			}
		}

		// Clean up empty price levels
		for (const price of pricesToRemove) {
			oppositeBook.delete(price);
			const idx = oppositePrices.indexOf(price);
			if (idx !== -1) oppositePrices.splice(idx, 1);
		}

		return { fills, remaining };
	}

	getSnapshot(depth: number = 20): OrderBookSnapshot {
		const bids: PriceLevel[] = [];
		for (const price of this.sortedBidPrices.slice(0, depth)) {
			const orders = this.bids.get(price)!;
			let totalQty = ZERO;
			for (const o of orders) totalQty = add(totalQty, o.remainingQuantity);
			bids.push({ price, quantity: totalQty, orderCount: orders.length });
		}

		const asks: PriceLevel[] = [];
		for (const price of this.sortedAskPrices.slice(0, depth)) {
			const orders = this.asks.get(price)!;
			let totalQty = ZERO;
			for (const o of orders) totalQty = add(totalQty, o.remainingQuantity);
			asks.push({ price, quantity: totalQty, orderCount: orders.length });
		}

		return {
			bids,
			asks,
			lastTradePrice: this.lastTradePrice,
			lastTradeTime: this.lastTradeTime
		};
	}
}
