<script lang="ts">
	import { t } from '$lib/i18n';
	import type { PriceLevel } from '$lib/stores/orderbook';

	interface Props {
		bids: PriceLevel[];
		asks: PriceLevel[];
		lastTradePrice: string | null;
		onPriceClick?: (price: string) => void;
	}

	let { bids, asks, lastTradePrice, onPriceClick }: Props = $props();

	function fp(value: string): string {
		return parseFloat(value).toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}

	function fq(value: string): string {
		return parseFloat(value).toLocaleString();
	}

	function maxQty(levels: PriceLevel[]): number {
		let max = 0;
		for (const l of levels) {
			const q = parseFloat(l.quantity);
			if (q > max) max = q;
		}
		return max || 1;
	}

	// Compute cumulative quantity for asks (bottom to top)
	function cumulativeAsks(levels: PriceLevel[]): string[] {
		const sliced = levels.slice(0, 14);
		const result: string[] = new Array(sliced.length).fill('0');
		let cum = 0;
		for (let i = 0; i < sliced.length; i++) {
			cum += parseFloat(sliced[i].quantity);
			result[i] = cum.toLocaleString();
		}
		return result;
	}

	function cumulativeBids(levels: PriceLevel[]): string[] {
		const sliced = levels.slice(0, 14);
		const result: string[] = [];
		let cum = 0;
		for (const l of sliced) {
			cum += parseFloat(l.quantity);
			result.push(cum.toLocaleString());
		}
		return result;
	}

	let spread = $derived(() => {
		if (asks.length > 0 && bids.length > 0) {
			const bestAsk = parseFloat(asks[0].price);
			const bestBid = parseFloat(bids[0].price);
			const diff = bestAsk - bestBid;
			const pct = bestBid > 0 ? ((diff / bestBid) * 100).toFixed(2) : '0';
			return { value: diff.toFixed(2), pct };
		}
		return null;
	});
</script>

<div class="ob-panel h-full flex flex-col">
	<!-- Header -->
	<div class="ob-header">
		<span class="ob-title">{$t('trade.orderbook')}</span>
	</div>

	<!-- Column Labels -->
	<div class="ob-cols">
		<span>{$t('trade.price')}</span>
		<span class="text-right">{$t('trade.quantity')}</span>
		<span class="text-right">CUM</span>
	</div>

	<!-- Asks — reversed so best ask (lowest price) is at bottom near spread -->
	<div class="ob-asks flex-1 min-h-0 overflow-y-auto flex flex-col-reverse">
		{#each asks.slice(0, 14) as level, i}
			{@const pct = (parseFloat(level.quantity) / maxQty(asks)) * 100}
			{@const cum = cumulativeAsks(asks.slice(0, 14))}
			<button
				class="ob-row ob-row-ask"
				onclick={() => onPriceClick?.(level.price)}
				title="Click to set price"
			>
				<div class="ob-depth-bar ob-depth-ask" style="width: {Math.min(pct, 100)}%"></div>
				<span class="ob-price ob-ask-price">{fp(level.price)}</span>
				<span class="ob-qty">{fq(level.quantity)}</span>
				<span class="ob-cum">{cum[i]}</span>
			</button>
		{/each}
	</div>

	<!-- Spread Indicator -->
	<div class="ob-spread">
		{#if lastTradePrice}
			<div class="ob-last-price">
				<span class="ob-last-value">{fp(lastTradePrice)}</span>
				<svg class="ob-arrow" viewBox="0 0 12 12" fill="currentColor">
					<path d="M6 2L10 7H2L6 2Z" />
				</svg>
			</div>
			{#if spread()}
				<span class="ob-spread-label">
					Spread {spread()!.value} ({spread()!.pct}%)
				</span>
			{/if}
		{:else}
			<span class="ob-spread-empty">--</span>
		{/if}
	</div>

	<!-- Bids -->
	<div class="ob-bids flex-1 min-h-0 overflow-y-auto">
		{#each bids.slice(0, 14) as level, i}
			{@const pct = (parseFloat(level.quantity) / maxQty(bids)) * 100}
			{@const cum = cumulativeBids(bids.slice(0, 14))}
			<button
				class="ob-row ob-row-bid"
				onclick={() => onPriceClick?.(level.price)}
				title="Click to set price"
			>
				<div class="ob-depth-bar ob-depth-bid" style="width: {Math.min(pct, 100)}%"></div>
				<span class="ob-price ob-bid-price">{fp(level.price)}</span>
				<span class="ob-qty">{fq(level.quantity)}</span>
				<span class="ob-cum">{cum[i]}</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.ob-panel {
		background: #0c1222;
		border-radius: 0.75rem;
		border: 1px solid #1e293b;
		overflow: hidden;
	}
	.ob-header {
		padding: 0.625rem 0.875rem;
		border-bottom: 1px solid #1e293b;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.ob-title {
		font-size: 0.6875rem;
		font-weight: 600;
		color: #94a3b8;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}
	.ob-cols {
		display: grid;
		grid-template-columns: 1fr 1fr 0.7fr;
		padding: 0.25rem 0.875rem;
		font-size: 0.625rem;
		font-weight: 500;
		color: #475569;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-bottom: 1px solid #1e293b;
	}
	.ob-row {
		position: relative;
		display: grid;
		grid-template-columns: 1fr 1fr 0.7fr;
		padding: 0.1875rem 0.875rem;
		font-size: 0.6875rem;
		cursor: pointer;
		transition: background 0.12s;
		width: 100%;
		text-align: left;
		background: transparent;
		border: none;
		color: inherit;
		font-family: 'IBM Plex Mono', 'Menlo', monospace;
	}
	.ob-row:hover {
		background: rgba(255, 255, 255, 0.03);
	}
	.ob-depth-bar {
		position: absolute;
		right: 0;
		top: 0;
		bottom: 0;
		transition: width 0.3s ease;
		pointer-events: none;
	}
	.ob-depth-ask {
		background: linear-gradient(90deg, transparent 0%, rgba(239, 68, 68, 0.12) 100%);
	}
	.ob-depth-bid {
		background: linear-gradient(90deg, transparent 0%, rgba(34, 197, 94, 0.12) 100%);
	}
	.ob-price {
		position: relative;
		font-weight: 500;
	}
	.ob-ask-price { color: #f87171; }
	.ob-bid-price { color: #4ade80; }
	.ob-qty {
		position: relative;
		text-align: right;
		color: #cbd5e1;
	}
	.ob-cum {
		position: relative;
		text-align: right;
		color: #475569;
		font-size: 0.625rem;
	}
	.ob-spread {
		padding: 0.5rem 0.875rem;
		border-top: 1px solid #1e293b;
		border-bottom: 1px solid #1e293b;
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: rgba(15, 23, 42, 0.6);
	}
	.ob-last-price {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	.ob-last-value {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 1rem;
		font-weight: 700;
		color: #f1f5f9;
		text-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
	}
	.ob-arrow {
		width: 0.75rem;
		height: 0.75rem;
		color: #4ade80;
	}
	.ob-spread-label {
		font-size: 0.625rem;
		color: #64748b;
		font-family: 'IBM Plex Mono', monospace;
	}
	.ob-spread-empty {
		color: #475569;
		font-size: 0.875rem;
		margin: 0 auto;
	}
</style>
