<script lang="ts">
	import { t } from '$lib/i18n';

	interface Trade {
		price: string;
		quantity: string;
		createdAt: string;
	}

	interface Props {
		trades: Trade[];
	}

	let { trades }: Props = $props();

	function fp(value: string): string {
		return parseFloat(value).toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}

	function fq(value: string): string {
		return parseFloat(value).toLocaleString();
	}

	function ftime(iso: string): string {
		return new Date(iso).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
	}

	function direction(index: number): 'up' | 'down' | 'neutral' {
		if (index === trades.length - 1) return 'neutral';
		const cur = parseFloat(trades[index].price);
		const next = parseFloat(trades[index + 1].price);
		if (cur > next) return 'up';
		if (cur < next) return 'down';
		return 'neutral';
	}
</script>

<div class="th-panel">
	<div class="th-header">
		<span class="th-title">{$t('trade.recentTrades')}</span>
		<span class="th-count">{trades.length}</span>
	</div>

	<!-- Column labels -->
	<div class="th-cols">
		<span>{$t('trade.price')}</span>
		<span class="text-right">{$t('trade.quantity')}</span>
		<span class="text-right">{$t('trade.time')}</span>
	</div>

	{#if trades.length === 0}
		<div class="th-empty">
			<svg class="th-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
				<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
			</svg>
			<span>{$t('trade.noTrades')}</span>
		</div>
	{:else}
		<div class="th-list">
			{#each trades as trade, i}
				{@const dir = direction(i)}
				<div class="th-row" class:th-row-flash={i === 0}>
					<div class="th-tick" class:th-tick-up={dir === 'up'} class:th-tick-down={dir === 'down'}></div>
					<span class="th-price" class:th-price-up={dir === 'up'} class:th-price-down={dir === 'down'} class:th-price-neutral={dir === 'neutral'}>
						{fp(trade.price)}
					</span>
					<span class="th-qty">{fq(trade.quantity)}</span>
					<span class="th-time">{ftime(trade.createdAt)}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.th-panel {
		background: #0c1222;
		border-radius: 0.75rem;
		border: 1px solid #1e293b;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}
	.th-header {
		padding: 0.625rem 0.875rem;
		border-bottom: 1px solid #1e293b;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.th-title {
		font-size: 0.6875rem;
		font-weight: 600;
		color: #94a3b8;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}
	.th-count {
		font-size: 0.5625rem;
		color: #475569;
		font-family: 'IBM Plex Mono', monospace;
		background: #1e293b;
		padding: 0.125rem 0.375rem;
		border-radius: 999px;
	}
	.th-cols {
		display: grid;
		grid-template-columns: 1fr 1fr 0.8fr;
		padding: 0.25rem 0.875rem 0.25rem 1.5rem;
		font-size: 0.625rem;
		font-weight: 500;
		color: #475569;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-bottom: 1px solid #1e293b;
	}
	.th-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 2.5rem 1rem;
		color: #334155;
		font-size: 0.75rem;
	}
	.th-empty-icon {
		width: 1.5rem;
		height: 1.5rem;
		opacity: 0.4;
	}
	.th-list {
		max-height: 280px;
		overflow-y: auto;
		scrollbar-width: thin;
		scrollbar-color: #1e293b transparent;
	}
	.th-row {
		position: relative;
		display: grid;
		grid-template-columns: 1fr 1fr 0.8fr;
		padding: 0.1875rem 0.875rem 0.1875rem 1.5rem;
		font-size: 0.6875rem;
		font-family: 'IBM Plex Mono', 'Menlo', monospace;
		transition: background 0.12s;
	}
	.th-row:hover {
		background: rgba(255, 255, 255, 0.02);
	}
	.th-row-flash {
		animation: th-flash 0.6s ease-out;
	}
	@keyframes th-flash {
		0% { background: rgba(99, 102, 241, 0.15); }
		100% { background: transparent; }
	}
	.th-tick {
		position: absolute;
		left: 0.875rem;
		top: 50%;
		transform: translateY(-50%);
		width: 0;
		height: 0;
		border-left: 3px solid transparent;
		border-right: 3px solid transparent;
	}
	.th-tick-up {
		border-bottom: 4px solid #4ade80;
	}
	.th-tick-down {
		border-top: 4px solid #f87171;
	}
	.th-price {
		font-weight: 500;
	}
	.th-price-up { color: #4ade80; }
	.th-price-down { color: #f87171; }
	.th-price-neutral { color: #94a3b8; }
	.th-qty {
		text-align: right;
		color: #cbd5e1;
	}
	.th-time {
		text-align: right;
		color: #475569;
		font-size: 0.625rem;
	}
</style>
