<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	interface Trade {
		price: string;
		quantity: string;
		createdAt: string;
	}

	interface Props {
		trades: Trade[];
		symbol: string;
	}

	let { trades, symbol }: Props = $props();

	let chartContainer: HTMLDivElement;
	let chart: any = null;
	let series: any = null;
	let resizeObserver: ResizeObserver | null = null;

	onMount(async () => {
		if (!browser || trades.length === 0) return;

		try {
			const { createChart, ColorType, LineStyle } = await import('lightweight-charts');

			chart = createChart(chartContainer, {
				layout: {
					background: { type: ColorType.Solid, color: '#0c1222' },
					textColor: '#475569',
					fontSize: 10,
					fontFamily: "'IBM Plex Mono', 'Menlo', monospace"
				},
				grid: {
					vertLines: { color: '#1e293b', style: LineStyle.Dotted },
					horzLines: { color: '#1e293b', style: LineStyle.Dotted }
				},
				width: chartContainer.clientWidth,
				height: 300,
				timeScale: {
					timeVisible: true,
					secondsVisible: false,
					borderColor: '#1e293b',
					fixLeftEdge: true,
					fixRightEdge: true
				},
				rightPriceScale: {
					borderColor: '#1e293b',
					scaleMargins: { top: 0.15, bottom: 0.1 }
				},
				crosshair: {
					vertLine: { color: 'rgba(99, 102, 241, 0.3)', labelBackgroundColor: '#6366f1' },
					horzLine: { color: 'rgba(99, 102, 241, 0.3)', labelBackgroundColor: '#6366f1' }
				},
				handleScroll: { vertTouchDrag: false }
			});

			series = chart.addAreaSeries({
				lineColor: '#6366f1',
				lineWidth: 2,
				topColor: 'rgba(99, 102, 241, 0.28)',
				bottomColor: 'rgba(99, 102, 241, 0.02)',
				priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
				crosshairMarkerBackgroundColor: '#6366f1',
				crosshairMarkerBorderColor: '#ffffff',
				crosshairMarkerBorderWidth: 2,
				crosshairMarkerRadius: 4
			});

			updateChartData();

			resizeObserver = new ResizeObserver(() => {
				if (chart && chartContainer) {
					chart.applyOptions({ width: chartContainer.clientWidth });
				}
			});
			resizeObserver.observe(chartContainer);
		} catch {
			// lightweight-charts may fail to load in SSR
		}
	});

	function updateChartData() {
		if (!series || trades.length === 0) return;

		const minuteMap = new Map<number, { time: number; value: number }>();

		for (const trade of [...trades].reverse()) {
			const ts = Math.floor(new Date(trade.createdAt).getTime() / 60000) * 60;
			minuteMap.set(ts, { time: ts, value: parseFloat(trade.price) });
		}

		const data = Array.from(minuteMap.values()).sort((a, b) => a.time - b.time);

		if (data.length > 0) {
			series.setData(data);
			chart?.timeScale().fitContent();
		}
	}

	$effect(() => {
		trades;
		updateChartData();
	});

	onDestroy(() => {
		resizeObserver?.disconnect();
		if (chart) {
			chart.remove();
			chart = null;
		}
	});
</script>

<div class="pc-panel">
	<div class="pc-header">
		<div class="pc-header-left">
			<span class="pc-symbol">{symbol}</span>
			{#if trades.length > 0}
				{@const latestPrice = parseFloat(trades[0].price)}
				<span class="pc-latest-price">
					{latestPrice.toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
				</span>
			{/if}
		</div>
		<span class="pc-chart-label">1M</span>
	</div>
	<div bind:this={chartContainer} class="pc-chart-area">
		{#if trades.length === 0}
			<div class="pc-empty">
				<svg class="pc-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
				</svg>
				<span>No chart data</span>
			</div>
		{/if}
	</div>
</div>

<style>
	.pc-panel {
		background: #0c1222;
		border-radius: 0.75rem;
		border: 1px solid #1e293b;
		overflow: hidden;
	}
	.pc-header {
		padding: 0.625rem 0.875rem;
		border-bottom: 1px solid #1e293b;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.pc-header-left {
		display: flex;
		align-items: baseline;
		gap: 0.625rem;
	}
	.pc-symbol {
		font-size: 0.8125rem;
		font-weight: 700;
		color: #f1f5f9;
		letter-spacing: 0.02em;
	}
	.pc-latest-price {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 0.75rem;
		font-weight: 600;
		color: #6366f1;
	}
	.pc-chart-label {
		font-size: 0.5625rem;
		font-weight: 600;
		color: #6366f1;
		background: rgba(99, 102, 241, 0.12);
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}
	.pc-chart-area {
		width: 100%;
		min-height: 300px;
		position: relative;
	}
	.pc-empty {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		color: #334155;
		font-size: 0.75rem;
	}
	.pc-empty-icon {
		width: 1.75rem;
		height: 1.75rem;
		opacity: 0.3;
	}
</style>
