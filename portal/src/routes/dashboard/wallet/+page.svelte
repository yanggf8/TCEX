<script lang="ts">
	import { t } from '$lib/i18n';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	let depositAmount = $state('');
	let withdrawAmount = $state('');
	let depositLoading = $state(false);
	let withdrawLoading = $state(false);
	let depositError = $state('');
	let withdrawError = $state('');
	let depositSuccess = $state('');
	let withdrawSuccess = $state('');
	let activeTab: 'deposit' | 'withdraw' = $state('deposit');

	function formatCurrency(value: string): string {
		const num = parseFloat(value || '0');
		return num.toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleString('zh-TW', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	async function handleDeposit() {
		depositError = '';
		depositSuccess = '';
		depositLoading = true;

		try {
			const res = await fetch('/api/v1/wallet/deposit', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ amount: depositAmount })
			});
			const result = await res.json();

			if (!res.ok) {
				depositError = result.error?.message || $t('common.error');
				return;
			}

			depositSuccess = $t('wallet.depositSuccess');
			depositAmount = '';
			await invalidateAll();
		} catch {
			depositError = $t('common.error');
		} finally {
			depositLoading = false;
		}
	}

	async function handleWithdraw() {
		withdrawError = '';
		withdrawSuccess = '';
		withdrawLoading = true;

		try {
			const res = await fetch('/api/v1/wallet/withdraw', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ amount: withdrawAmount })
			});
			const result = await res.json();

			if (!res.ok) {
				withdrawError = result.error?.message || $t('common.error');
				return;
			}

			withdrawSuccess = $t('wallet.withdrawSuccess');
			withdrawAmount = '';
			await invalidateAll();
		} catch {
			withdrawError = $t('common.error');
		} finally {
			withdrawLoading = false;
		}
	}

	function txTypeLabel(type: string): string {
		const map: Record<string, string> = {
			deposit: $t('wallet.txType.deposit'),
			withdrawal: $t('wallet.txType.withdrawal'),
			trade_buy: $t('wallet.txType.tradeBuy'),
			trade_sell: $t('wallet.txType.tradeSell'),
			fee: $t('wallet.txType.fee'),
			lock: $t('wallet.txType.lock'),
			unlock: $t('wallet.txType.unlock')
		};
		return map[type] || type;
	}

	function txTypeColor(type: string): string {
		if (type === 'deposit' || type === 'trade_sell' || type === 'unlock') return 'text-green-600';
		if (type === 'withdrawal' || type === 'trade_buy' || type === 'lock' || type === 'fee') return 'text-red-600';
		return 'text-gray-600';
	}

	function txAmountSign(type: string): string {
		if (type === 'deposit' || type === 'trade_sell' || type === 'unlock') return '+';
		return '-';
	}
</script>

<svelte:head>
	<title>{$t('wallet.title')} | TCEX</title>
</svelte:head>

<div class="space-y-6 pb-20 lg:pb-0">
	<!-- Header -->
	<div>
		<h1 class="text-2xl font-bold text-gray-900">{$t('wallet.title')}</h1>
		<p class="text-gray-500 mt-1">{$t('wallet.subtitle')}</p>
	</div>

	<!-- Balance Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
		<div class="bg-white rounded-xl border border-gray-200 p-5">
			<p class="text-sm text-gray-500 mb-1">{$t('wallet.availableBalance')}</p>
			<p class="text-2xl font-bold text-gray-900">NT$ {formatCurrency(data.wallet?.availableBalance || '0')}</p>
		</div>
		<div class="bg-white rounded-xl border border-gray-200 p-5">
			<p class="text-sm text-gray-500 mb-1">{$t('wallet.lockedBalance')}</p>
			<p class="text-2xl font-bold text-gray-900">NT$ {formatCurrency(data.wallet?.lockedBalance || '0')}</p>
		</div>
		<div class="bg-white rounded-xl border border-gray-200 p-5">
			<p class="text-sm text-gray-500 mb-1">{$t('wallet.totalBalance')}</p>
			<p class="text-2xl font-bold text-primary-600">
				NT$ {formatCurrency(
					String(parseFloat(data.wallet?.availableBalance || '0') + parseFloat(data.wallet?.lockedBalance || '0'))
				)}
			</p>
		</div>
	</div>

	<!-- Deposit / Withdraw -->
	<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
		<!-- Tabs -->
		<div class="flex border-b border-gray-200">
			<button
				class="flex-1 px-4 py-3 text-sm font-medium transition-colors {activeTab === 'deposit'
					? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
					: 'text-gray-500 hover:text-gray-700'}"
				onclick={() => { activeTab = 'deposit'; depositError = ''; depositSuccess = ''; }}
			>
				{$t('wallet.deposit')}
			</button>
			<button
				class="flex-1 px-4 py-3 text-sm font-medium transition-colors {activeTab === 'withdraw'
					? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
					: 'text-gray-500 hover:text-gray-700'}"
				onclick={() => { activeTab = 'withdraw'; withdrawError = ''; withdrawSuccess = ''; }}
			>
				{$t('wallet.withdraw')}
			</button>
		</div>

		<div class="p-6">
			{#if activeTab === 'deposit'}
				<form onsubmit={(e) => { e.preventDefault(); handleDeposit(); }} class="space-y-4">
					<div>
						<label for="deposit-amount" class="block text-sm font-medium text-gray-700 mb-1">
							{$t('wallet.amount')} (TWD)
						</label>
						<input
							id="deposit-amount"
							type="text"
							inputmode="decimal"
							bind:value={depositAmount}
							placeholder={$t('wallet.amountPlaceholder')}
							class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
						/>
						<p class="mt-1 text-xs text-gray-400">{$t('wallet.depositMinMax')}</p>
					</div>

					<!-- Quick amounts -->
					<div class="flex gap-2">
						{#each ['1000', '5000', '10000', '50000'] as amt}
							<button
								type="button"
								onclick={() => { depositAmount = amt; }}
								class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
							>
								NT$ {parseInt(amt).toLocaleString()}
							</button>
						{/each}
					</div>

					{#if depositError}
						<p class="text-sm text-red-600">{depositError}</p>
					{/if}
					{#if depositSuccess}
						<p class="text-sm text-green-600">{depositSuccess}</p>
					{/if}

					<button
						type="submit"
						disabled={depositLoading || !depositAmount}
						class="w-full py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{depositLoading ? $t('common.loading') : $t('wallet.confirmDeposit')}
					</button>
				</form>
			{:else}
				<form onsubmit={(e) => { e.preventDefault(); handleWithdraw(); }} class="space-y-4">
					<div>
						<label for="withdraw-amount" class="block text-sm font-medium text-gray-700 mb-1">
							{$t('wallet.amount')} (TWD)
						</label>
						<input
							id="withdraw-amount"
							type="text"
							inputmode="decimal"
							bind:value={withdrawAmount}
							placeholder={$t('wallet.amountPlaceholder')}
							class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
						/>
						<p class="mt-1 text-xs text-gray-400">
							{$t('wallet.availableForWithdraw')}: NT$ {formatCurrency(data.wallet?.availableBalance || '0')}
						</p>
					</div>

					{#if withdrawError}
						<p class="text-sm text-red-600">{withdrawError}</p>
					{/if}
					{#if withdrawSuccess}
						<p class="text-sm text-green-600">{withdrawSuccess}</p>
					{/if}

					<button
						type="submit"
						disabled={withdrawLoading || !withdrawAmount}
						class="w-full py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{withdrawLoading ? $t('common.loading') : $t('wallet.confirmWithdraw')}
					</button>
				</form>
			{/if}
		</div>
	</div>

	<!-- Deposit/Withdraw Summary -->
	<div class="grid grid-cols-2 gap-4">
		<div class="bg-white rounded-xl border border-gray-200 p-5">
			<p class="text-sm text-gray-500 mb-1">{$t('wallet.totalDeposited')}</p>
			<p class="text-lg font-semibold text-green-600">NT$ {formatCurrency(data.wallet?.totalDeposited || '0')}</p>
		</div>
		<div class="bg-white rounded-xl border border-gray-200 p-5">
			<p class="text-sm text-gray-500 mb-1">{$t('wallet.totalWithdrawn')}</p>
			<p class="text-lg font-semibold text-red-600">NT$ {formatCurrency(data.wallet?.totalWithdrawn || '0')}</p>
		</div>
	</div>

	<!-- Transaction History -->
	<div>
		<h2 class="text-lg font-semibold text-gray-900 mb-3">{$t('wallet.transactionHistory')}</h2>

		{#if data.transactions.length === 0}
			<div class="bg-white rounded-xl border border-gray-200 p-8 text-center">
				<div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
					<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
					</svg>
				</div>
				<p class="text-gray-500">{$t('wallet.noTransactions')}</p>
			</div>
		{:else}
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
				<!-- Desktop Table -->
				<div class="hidden sm:block overflow-x-auto">
					<table class="w-full">
						<thead class="bg-gray-50 border-b border-gray-200">
							<tr>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{$t('wallet.txDate')}</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{$t('wallet.txType')}</th>
								<th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{$t('wallet.txAmount')}</th>
								<th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{$t('wallet.txBalance')}</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{$t('wallet.txStatus')}</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-100">
							{#each data.transactions as tx}
								<tr class="hover:bg-gray-50">
									<td class="px-4 py-3 text-sm text-gray-600">{formatDate(tx.createdAt)}</td>
									<td class="px-4 py-3 text-sm font-medium {txTypeColor(tx.type)}">{txTypeLabel(tx.type)}</td>
									<td class="px-4 py-3 text-sm text-right font-mono {txTypeColor(tx.type)}">
										{txAmountSign(tx.type)}NT$ {formatCurrency(tx.amount)}
									</td>
									<td class="px-4 py-3 text-sm text-right font-mono text-gray-600">
										NT$ {formatCurrency(tx.balanceAfter)}
									</td>
									<td class="px-4 py-3">
										<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
											{$t('wallet.statusCompleted')}
										</span>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<!-- Mobile Cards -->
				<div class="sm:hidden divide-y divide-gray-100">
					{#each data.transactions as tx}
						<div class="p-4">
							<div class="flex justify-between items-start mb-1">
								<span class="text-sm font-medium {txTypeColor(tx.type)}">{txTypeLabel(tx.type)}</span>
								<span class="text-sm font-mono {txTypeColor(tx.type)}">
									{txAmountSign(tx.type)}NT$ {formatCurrency(tx.amount)}
								</span>
							</div>
							<div class="flex justify-between items-center">
								<span class="text-xs text-gray-400">{formatDate(tx.createdAt)}</span>
								<span class="text-xs text-gray-500">{$t('wallet.txBalance')}: NT$ {formatCurrency(tx.balanceAfter)}</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
