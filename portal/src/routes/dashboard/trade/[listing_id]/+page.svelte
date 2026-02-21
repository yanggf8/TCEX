<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { t, locale } from '$lib/i18n';
	import { invalidateAll } from '$app/navigation';
	import OrderBook from '$lib/components/OrderBook.svelte';
	import OrderForm from '$lib/components/OrderForm.svelte';
	import TradeHistory from '$lib/components/TradeHistory.svelte';
	import PriceChart from '$lib/components/PriceChart.svelte';
	import { connectWS, disconnectWS } from '$lib/stores/websocket';
	import { orderbook, initOrderbookStore, setOrderbookSnapshot } from '$lib/stores/orderbook';
	import { recentTrades, initTradesStore, setInitialTrades } from '$lib/stores/trades';

	let { data } = $props();
	let orderFormRef: OrderForm;
	let cleanupOrderbook: (() => void) | null = null;
	let cleanupTrades: (() => void) | null = null;

	function getName(): string {
		return $locale === 'zh-TW' ? data.listing.nameZh : data.listing.nameEn;
	}

	function formatCurrency(value: string): string {
		return parseFloat(value || '0').toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}

	function handlePriceClick(price: string) {
		orderFormRef?.setPrice(price);
	}

	function handleOrderPlaced() {
		invalidateAll();
	}

	onMount(() => {
		setInitialTrades(data.recentTrades);
		if (data.initialOrderbook) {
			setOrderbookSnapshot(data.initialOrderbook);
		}
		connectWS(data.listing.id);
		cleanupOrderbook = initOrderbookStore();
		cleanupTrades = initTradesStore();
	});

	onDestroy(() => {
		disconnectWS();
		cleanupOrderbook?.();
		cleanupTrades?.();
	});
</script>

<svelte:head>
	<title>{data.listing.symbol} {$t('trade.trading')} | TCEX</title>
</svelte:head>

<div class="tp-root">
	<!-- Header Strip -->
	<div class="tp-header">
		<div class="tp-header-left">
			<a href="/dashboard" class="tp-back" title="Back">
				<svg class="tp-back-icon" viewBox="0 0 20 20" fill="currentColor">
					<path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
				</svg>
			</a>
			<div class="tp-ticker">
				<span class="tp-symbol">{data.listing.symbol}</span>
				<span class="tp-name">{getName()}</span>
				<span class="tp-type-badge">{data.listing.productType}</span>
			</div>
		</div>
		<div class="tp-header-right">
			<div class="tp-price-block">
				<span class="tp-main-price">
					<span class="tp-currency">NT$</span>
					{formatCurrency(data.listing.unitPrice)}
				</span>
				{#if data.listing.yieldRate}
					<span class="tp-yield">
						<svg class="tp-yield-icon" viewBox="0 0 16 16" fill="currentColor">
							<path d="M8 2L12 7H4L8 2Z" />
						</svg>
						{data.listing.yieldRate}%
					</span>
				{/if}
			</div>
		</div>
	</div>

	<!-- Three-Panel Grid -->
	<div class="tp-grid">
		<!-- Left: Order Book -->
		<div class="tp-col-book">
			<OrderBook
				bids={$orderbook.bids}
				asks={$orderbook.asks}
				lastTradePrice={$orderbook.lastTradePrice}
				onPriceClick={handlePriceClick}
			/>
		</div>

		<!-- Center: Chart + Trade History -->
		<div class="tp-col-center">
			<PriceChart trades={$recentTrades} symbol={data.listing.symbol} />
			<TradeHistory trades={$recentTrades} />
		</div>

		<!-- Right: Order Form + Open Orders -->
		<div class="tp-col-form">
			<OrderForm
				bind:this={orderFormRef}
				listingId={data.listing.id}
				listingSymbol={data.listing.symbol}
				unitPrice={data.listing.unitPrice}
				availableBalance={data.availableBalance}
				positionQuantity={data.position?.quantity || null}
				onOrderPlaced={handleOrderPlaced}
			/>

			<!-- Open Orders Card -->
			<div class="tp-orders-card">
				<div class="tp-orders-header">
					<span class="tp-orders-title">{$t('trade.myOrders')}</span>
					{#if data.openOrders.length > 0}
						<span class="tp-orders-count">{data.openOrders.length}</span>
					{/if}
				</div>
				{#if data.openOrders.length === 0}
					<div class="tp-orders-empty">
						{$t('orders.noActive')}
					</div>
				{:else}
					<div class="tp-orders-list">
						{#each data.openOrders as order}
							<div class="tp-order-row">
								<div class="tp-order-info">
									<span class="tp-order-side" class:tp-side-buy={order.side === 'buy'} class:tp-side-sell={order.side === 'sell'}>
										{order.side === 'buy' ? $t('orders.buy') : $t('orders.sell')}
									</span>
									<span class="tp-order-detail">
										NT$ {formatCurrency(order.price)} × {parseFloat(order.remainingQuantity).toLocaleString()}
									</span>
								</div>
								<button
									onclick={async () => {
										await fetch(`/api/v1/orders/${order.id}`, { method: 'DELETE' });
										invalidateAll();
									}}
									class="tp-order-cancel"
								>
									{$t('orders.cancel')}
								</button>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	/* ── Root ── */
	.tp-root {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding-bottom: 5rem;
	}
	@media (min-width: 1024px) {
		.tp-root { padding-bottom: 0; }
	}

	/* ── Header ── */
	.tp-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.75rem;
	}
	.tp-header-left {
		display: flex;
		align-items: center;
		gap: 0.625rem;
	}
	.tp-back {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		color: #64748b;
		transition: all 0.15s;
		flex-shrink: 0;
	}
	.tp-back:hover { background: #f1f5f9; color: #334155; }
	.tp-back-icon { width: 1.125rem; height: 1.125rem; }
	.tp-ticker {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.tp-symbol {
		font-size: 1.25rem;
		font-weight: 800;
		color: #0f172a;
		letter-spacing: -0.01em;
	}
	.tp-name {
		font-size: 0.8125rem;
		color: #64748b;
	}
	.tp-type-badge {
		font-size: 0.625rem;
		font-weight: 700;
		color: #3b82f6;
		background: #eff6ff;
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}
	.tp-header-right {
		text-align: right;
	}
	.tp-price-block {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: flex-end;
	}
	.tp-main-price {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 1.5rem;
		font-weight: 700;
		color: #0f172a;
	}
	.tp-currency {
		font-size: 0.75rem;
		font-weight: 400;
		color: #94a3b8;
		margin-right: 0.125rem;
	}
	.tp-yield {
		display: inline-flex;
		align-items: center;
		gap: 0.125rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: #16a34a;
		font-family: 'IBM Plex Mono', monospace;
	}
	.tp-yield-icon { width: 0.625rem; height: 0.625rem; }

	/* ── Three-Panel Grid ── */
	.tp-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.75rem;
	}
	@media (min-width: 1024px) {
		.tp-grid {
			grid-template-columns: 260px 1fr 320px;
			gap: 0.75rem;
		}
	}

	.tp-col-book {
		display: flex;
		flex-direction: column;
	}
	.tp-col-center {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		min-width: 0;
	}
	.tp-col-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	/* ── Open Orders Card ── */
	.tp-orders-card {
		background: #ffffff;
		border-radius: 0.75rem;
		border: 1px solid #e2e8f0;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
	}
	.tp-orders-header {
		padding: 0.625rem 0.875rem;
		border-bottom: 1px solid #f1f5f9;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.tp-orders-title {
		font-size: 0.75rem;
		font-weight: 600;
		color: #334155;
	}
	.tp-orders-count {
		font-size: 0.5625rem;
		font-weight: 600;
		color: #6366f1;
		background: #eef2ff;
		padding: 0.0625rem 0.375rem;
		border-radius: 999px;
		font-family: 'IBM Plex Mono', monospace;
	}
	.tp-orders-empty {
		padding: 1.5rem 1rem;
		text-align: center;
		font-size: 0.75rem;
		color: #94a3b8;
	}
	.tp-orders-list {
		max-height: 250px;
		overflow-y: auto;
	}
	.tp-order-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.875rem;
		border-bottom: 1px solid #f8fafc;
		transition: background 0.1s;
	}
	.tp-order-row:hover { background: #f8fafc; }
	.tp-order-row:last-child { border-bottom: none; }
	.tp-order-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.tp-order-side {
		font-size: 0.625rem;
		font-weight: 700;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.tp-side-buy { background: #f0fdf4; color: #15803d; }
	.tp-side-sell { background: #fef2f2; color: #b91c1c; }
	.tp-order-detail {
		font-size: 0.6875rem;
		font-family: 'IBM Plex Mono', monospace;
		color: #475569;
	}
	.tp-order-cancel {
		font-size: 0.6875rem;
		font-weight: 600;
		color: #ef4444;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
		transition: all 0.15s;
	}
	.tp-order-cancel:hover { background: #fef2f2; color: #b91c1c; }
</style>
