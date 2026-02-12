import { writable } from 'svelte/store';
import { onWSMessage } from './websocket';
import type { WSMessage } from './websocket';

export interface PriceLevel {
	price: string;
	quantity: string;
	orderCount: number;
}

export interface OrderBookState {
	bids: PriceLevel[];
	asks: PriceLevel[];
	lastTradePrice: string | null;
	lastTradeTime: string | null;
}

export const orderbook = writable<OrderBookState>({
	bids: [],
	asks: [],
	lastTradePrice: null,
	lastTradeTime: null
});

export function initOrderbookStore(): () => void {
	return onWSMessage((msg: WSMessage) => {
		if (msg.type === 'orderbook' && msg.snapshot) {
			orderbook.set(msg.snapshot);
		}
	});
}

export function setOrderbookSnapshot(snapshot: OrderBookState): void {
	orderbook.set(snapshot);
}
