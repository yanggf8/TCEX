<script lang="ts">
	import { t } from '$lib/i18n';

	interface Props {
		listingId: string;
		listingSymbol: string;
		unitPrice: string;
		availableBalance: string;
		positionQuantity: string | null;
		onOrderPlaced?: () => void;
	}

	let { listingId, listingSymbol, unitPrice, availableBalance, positionQuantity, onOrderPlaced }: Props = $props();

	let side: 'buy' | 'sell' = $state('buy');
	let price = $state(unitPrice);
	let quantity = $state('');
	let loading = $state(false);
	let error = $state('');
	let success = $state('');

	let total = $derived(() => {
		const p = parseFloat(price || '0');
		const q = parseFloat(quantity || '0');
		return (p * q).toFixed(2);
	});

	let totalFormatted = $derived(() => {
		return parseFloat(total()).toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	});

	function fmt(value: string): string {
		return parseFloat(value || '0').toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}

	function setQuickAmount(pct: number) {
		if (side === 'buy') {
			const bal = parseFloat(availableBalance || '0');
			const p = parseFloat(price || '0');
			if (p > 0) {
				quantity = Math.floor((bal * pct / 100) / p).toString();
			}
		} else {
			const pos = parseFloat(positionQuantity || '0');
			quantity = Math.floor(pos * pct / 100).toString();
		}
	}

	export function setPrice(p: string) {
		price = p;
	}

	async function submitOrder() {
		error = '';
		success = '';
		loading = true;

		try {
			const res = await fetch('/api/v1/orders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ listingId, side, price, quantity })
			});
			const result = await res.json();

			if (!res.ok) {
				error = result.error?.message || $t('common.error');
				return;
			}

			success = $t('trade.orderPlaced');
			quantity = '';
			onOrderPlaced?.();
		} catch {
			error = $t('common.error');
		} finally {
			loading = false;
		}
	}
</script>

<div class="of-panel">
	<!-- Buy/Sell Toggle -->
	<div class="of-toggle">
		<button
			class="of-toggle-btn {side === 'buy' ? 'of-toggle-active-buy' : 'of-toggle-inactive'}"
			onclick={() => { side = 'buy'; error = ''; success = ''; }}
		>
			<svg class="of-icon" viewBox="0 0 16 16" fill="currentColor">
				<path d="M8 2v12M3 9l5 5 5-5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="rotate(180 8 8)"/>
			</svg>
			{$t('trade.buy')}
		</button>
		<button
			class="of-toggle-btn {side === 'sell' ? 'of-toggle-active-sell' : 'of-toggle-inactive'}"
			onclick={() => { side = 'sell'; error = ''; success = ''; }}
		>
			<svg class="of-icon" viewBox="0 0 16 16" fill="currentColor">
				<path d="M8 2v12M3 9l5 5 5-5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
			{$t('trade.sell')}
		</button>
	</div>

	<div class="of-body">
		<!-- Available indicator -->
		<div class="of-available">
			<span class="of-available-label">
				{side === 'buy' ? $t('trade.availableBalance') : $t('trade.availablePosition')}
			</span>
			<span class="of-available-value">
				{#if side === 'buy'}
					<span class="of-currency">NT$</span> {fmt(availableBalance)}
				{:else}
					{positionQuantity ? parseFloat(positionQuantity).toLocaleString() : '0'}
					<span class="of-unit">{$t('portfolio.units')}</span>
				{/if}
			</span>
		</div>

		<!-- Price Input -->
		<div class="of-field">
			<div class="of-field-header">
				<label class="of-label" for="of-price">{$t('trade.price')}</label>
				<span class="of-field-unit">TWD</span>
			</div>
			<div class="of-input-wrap {side === 'buy' ? 'of-input-buy' : 'of-input-sell'}">
				<input
					id="of-price"
					type="text"
					inputmode="decimal"
					bind:value={price}
					class="of-input"
				/>
			</div>
		</div>

		<!-- Quantity Input -->
		<div class="of-field">
			<div class="of-field-header">
				<label class="of-label" for="of-qty">{$t('trade.quantity')}</label>
				<span class="of-field-unit">{$t('portfolio.units')}</span>
			</div>
			<div class="of-input-wrap {side === 'buy' ? 'of-input-buy' : 'of-input-sell'}">
				<input
					id="of-qty"
					type="text"
					inputmode="numeric"
					bind:value={quantity}
					placeholder="0"
					class="of-input"
				/>
			</div>
		</div>

		<!-- Quick-fill Buttons -->
		<div class="of-quick">
			{#each [25, 50, 75, 100] as pct}
				<button
					type="button"
					class="of-quick-btn"
					onclick={() => setQuickAmount(pct)}
				>
					{pct}%
				</button>
			{/each}
		</div>

		<!-- Divider + Total -->
		<div class="of-total-section">
			<div class="of-total-row">
				<span class="of-total-label">{$t('trade.total')}</span>
				<span class="of-total-value">
					<span class="of-currency">NT$</span> {totalFormatted()}
				</span>
			</div>
		</div>

		<!-- Messages -->
		{#if error}
			<div class="of-msg of-msg-error">{error}</div>
		{/if}
		{#if success}
			<div class="of-msg of-msg-success">{success}</div>
		{/if}

		<!-- Submit Button -->
		<button
			onclick={submitOrder}
			disabled={loading || !price || !quantity}
			class="of-submit {side === 'buy' ? 'of-submit-buy' : 'of-submit-sell'}"
		>
			{#if loading}
				<span class="of-spinner"></span>
			{/if}
			{loading ? '' : (side === 'buy' ? $t('trade.buyAction') : $t('trade.sellAction'))}
			{listingSymbol}
		</button>
	</div>
</div>

<style>
	.of-panel {
		background: #ffffff;
		border-radius: 0.75rem;
		border: 1px solid #e2e8f0;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
	}
	.of-toggle {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0;
	}
	.of-toggle-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		padding: 0.75rem;
		font-size: 0.8125rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
	}
	.of-icon { width: 0.875rem; height: 0.875rem; }
	.of-toggle-active-buy {
		background: linear-gradient(135deg, #15803d 0%, #22c55e 100%);
		color: #ffffff;
		box-shadow: inset 0 -2px 0 rgba(0, 0, 0, 0.15);
	}
	.of-toggle-active-sell {
		background: linear-gradient(135deg, #b91c1c 0%, #ef4444 100%);
		color: #ffffff;
		box-shadow: inset 0 -2px 0 rgba(0, 0, 0, 0.15);
	}
	.of-toggle-inactive {
		background: #f8fafc;
		color: #94a3b8;
	}
	.of-toggle-inactive:hover {
		background: #f1f5f9;
		color: #64748b;
	}
	.of-body { padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
	.of-available {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0.625rem;
		background: #f8fafc;
		border-radius: 0.5rem;
		border: 1px solid #f1f5f9;
	}
	.of-available-label { font-size: 0.6875rem; color: #64748b; }
	.of-available-value {
		font-size: 0.75rem;
		font-weight: 600;
		color: #1e293b;
		font-family: 'IBM Plex Mono', monospace;
	}
	.of-currency { color: #94a3b8; font-weight: 400; font-size: 0.625rem; }
	.of-unit { color: #94a3b8; font-size: 0.625rem; margin-left: 0.125rem; }
	.of-field { display: flex; flex-direction: column; gap: 0.25rem; }
	.of-field-header { display: flex; justify-content: space-between; align-items: center; }
	.of-label { font-size: 0.6875rem; font-weight: 500; color: #475569; }
	.of-field-unit { font-size: 0.625rem; color: #94a3b8; font-family: 'IBM Plex Mono', monospace; }
	.of-input-wrap {
		border: 1.5px solid #e2e8f0;
		border-radius: 0.5rem;
		overflow: hidden;
		transition: border-color 0.15s, box-shadow 0.15s;
		border-left: 3px solid #e2e8f0;
	}
	.of-input-wrap:focus-within { border-color: #94a3b8; box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.1); }
	.of-input-buy:focus-within { border-left-color: #22c55e; border-color: #86efac; box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.08); }
	.of-input-sell:focus-within { border-left-color: #ef4444; border-color: #fca5a5; box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08); }
	.of-input {
		width: 100%;
		padding: 0.5rem 0.625rem;
		font-family: 'IBM Plex Mono', monospace;
		font-size: 0.875rem;
		font-weight: 500;
		color: #1e293b;
		background: transparent;
		border: none;
		outline: none;
	}
	.of-input::placeholder { color: #cbd5e1; }
	.of-quick { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.375rem; }
	.of-quick-btn {
		padding: 0.3125rem;
		font-size: 0.6875rem;
		font-weight: 600;
		color: #64748b;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.15s;
		font-family: 'IBM Plex Mono', monospace;
	}
	.of-quick-btn:hover { background: #f1f5f9; border-color: #cbd5e1; color: #334155; }
	.of-total-section {
		padding-top: 0.625rem;
		border-top: 1px solid #f1f5f9;
	}
	.of-total-row { display: flex; justify-content: space-between; align-items: center; }
	.of-total-label { font-size: 0.75rem; font-weight: 500; color: #64748b; }
	.of-total-value {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 0.9375rem;
		font-weight: 700;
		color: #0f172a;
	}
	.of-msg { font-size: 0.6875rem; padding: 0.375rem 0.5rem; border-radius: 0.375rem; }
	.of-msg-error { background: #fef2f2; color: #b91c1c; }
	.of-msg-success { background: #f0fdf4; color: #15803d; }
	.of-submit {
		width: 100%;
		padding: 0.6875rem;
		border: none;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 700;
		letter-spacing: 0.03em;
		color: #ffffff;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
	}
	.of-submit:disabled { opacity: 0.4; cursor: not-allowed; }
	.of-submit-buy {
		background: linear-gradient(135deg, #15803d 0%, #16a34a 50%, #22c55e 100%);
		box-shadow: 0 2px 8px rgba(34, 197, 94, 0.25);
	}
	.of-submit-buy:not(:disabled):hover { box-shadow: 0 4px 16px rgba(34, 197, 94, 0.35); transform: translateY(-1px); }
	.of-submit-sell {
		background: linear-gradient(135deg, #991b1b 0%, #dc2626 50%, #ef4444 100%);
		box-shadow: 0 2px 8px rgba(239, 68, 68, 0.25);
	}
	.of-submit-sell:not(:disabled):hover { box-shadow: 0 4px 16px rgba(239, 68, 68, 0.35); transform: translateY(-1px); }
	.of-spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: #fff;
		border-radius: 50%;
		animation: of-spin 0.6s linear infinite;
	}
	@keyframes of-spin { to { transform: rotate(360deg); } }
</style>
