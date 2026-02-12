import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

export interface WSMessage {
	type: string;
	[key: string]: any;
}

export const wsConnected = writable(false);
export const wsMessages = writable<WSMessage[]>([]);

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let currentListingId: string | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY = 1000;

const messageHandlers = new Set<(msg: WSMessage) => void>();

export function onWSMessage(handler: (msg: WSMessage) => void): () => void {
	messageHandlers.add(handler);
	return () => messageHandlers.delete(handler);
}

export function connectWS(listingId: string): void {
	if (!browser) return;

	// If already connected to this listing, skip
	if (currentListingId === listingId && ws && ws.readyState === WebSocket.OPEN) return;

	disconnectWS();
	currentListingId = listingId;
	reconnectAttempts = 0;

	doConnect(listingId);
}

function doConnect(listingId: string): void {
	const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
	const engineHost = window.location.host; // In prod, this would be the engine host
	const wsUrl = `${protocol}//${engineHost}/ws/v1/listing/${listingId}`;

	try {
		ws = new WebSocket(wsUrl);
	} catch {
		scheduleReconnect(listingId);
		return;
	}

	ws.onopen = () => {
		wsConnected.set(true);
		reconnectAttempts = 0;
	};

	ws.onmessage = (event) => {
		try {
			const msg = JSON.parse(event.data) as WSMessage;
			wsMessages.update(msgs => [...msgs.slice(-99), msg]);
			for (const handler of messageHandlers) {
				handler(msg);
			}
		} catch {
			// Ignore malformed messages
		}
	};

	ws.onclose = () => {
		wsConnected.set(false);
		if (currentListingId === listingId) {
			scheduleReconnect(listingId);
		}
	};

	ws.onerror = () => {
		wsConnected.set(false);
	};
}

function scheduleReconnect(listingId: string): void {
	if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return;
	if (reconnectTimer) clearTimeout(reconnectTimer);

	const delay = BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts);
	reconnectAttempts++;

	reconnectTimer = setTimeout(() => {
		if (currentListingId === listingId) {
			doConnect(listingId);
		}
	}, delay);
}

export function disconnectWS(): void {
	currentListingId = null;
	if (reconnectTimer) {
		clearTimeout(reconnectTimer);
		reconnectTimer = null;
	}
	if (ws) {
		ws.close();
		ws = null;
	}
	wsConnected.set(false);
}

export function sendWS(message: object): void {
	if (ws && ws.readyState === WebSocket.OPEN) {
		ws.send(JSON.stringify(message));
	}
}
