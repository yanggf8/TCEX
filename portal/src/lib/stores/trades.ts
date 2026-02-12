import { writable } from 'svelte/store';
import { onWSMessage } from './websocket';
import type { WSMessage } from './websocket';

export interface RecentTrade {
	price: string;
	quantity: string;
	createdAt: string;
}

export const recentTrades = writable<RecentTrade[]>([]);

export function initTradesStore(): () => void {
	return onWSMessage((msg: WSMessage) => {
		if (msg.type === 'trades' && msg.trades) {
			recentTrades.update(current => {
				const updated = [...msg.trades, ...current];
				return updated.slice(0, 50); // Keep last 50
			});
		}
	});
}

export function setInitialTrades(trades: RecentTrade[]): void {
	recentTrades.set(trades);
}
