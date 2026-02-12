<script lang="ts">
	import { t, locale } from '$lib/i18n';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();
	let activeTab: 'active' | 'history' = $state('active');
	let cancelling = $state<string | null>(null);
	let orders = $derived(activeTab === 'active' ? data.activeOrders : data.historyOrders);

	function getName(order: any): string {
		return $locale === 'zh-TW' ? order.listingNameZh : order.listingNameEn;
	}

	function formatCurrency(value: string | null): string {
		if (!value) return '--';
		const num = parseFloat(value);
		return num.toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleString('zh-TW', {
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function sideLabel(side: string): string {
		return side === 'buy' ? $t('orders.buy') : $t('orders.sell');
	}

	function sideColor(side: string): string {
		return side === 'buy' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
	}

	function statusLabel(status: string): string {
		const map: Record<string, string> = {
			pending: $t('orders.status.pending'),
			partial: $t('orders.status.partial'),
			filled: $t('orders.status.filled'),
			cancelled: $t('orders.status.cancelled')
		};
		return map[status] || status;
	}

	function statusColor(status: string): string {
		if (status === 'filled') return 'text-green-600 bg-green-50';
		if (status === 'cancelled') return 'text-gray-500 bg-gray-100';
		if (status === 'partial') return 'text-yellow-600 bg-yellow-50';
		return 'text-blue-600 bg-blue-50';
	}

	async function cancelOrder(orderId: string) {
		cancelling = orderId;
		try {
			const res = await fetch(`/api/v1/orders/${orderId}`, { method: 'DELETE' });
			if (res.ok) {
				await invalidateAll();
			}
		} finally {
			cancelling = null;
		}
	}
</script>

<svelte:head>
	<title>{$t('orders.title')} | TCEX</title>
</svelte:head>

<div class="space-y-6 pb-20 lg:pb-0">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">{$t('orders.title')}</h1>
		<p class="text-gray-500 mt-1">{$t('orders.subtitle')}</p>
	</div>

	<!-- Summary -->
	<div class="grid grid-cols-3 gap-4">
		<div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
			<p class="text-2xl font-bold text-blue-600">{data.summary.activeCount}</p>
			<p class="text-xs text-gray-500 mt-1">{$t('orders.activeOrders')}</p>
		</div>
		<div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
			<p class="text-2xl font-bold text-green-600">{data.summary.filledCount}</p>
			<p class="text-xs text-gray-500 mt-1">{$t('orders.filledOrders')}</p>
		</div>
		<div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
			<p class="text-2xl font-bold text-gray-500">{data.summary.cancelledCount}</p>
			<p class="text-xs text-gray-500 mt-1">{$t('orders.cancelledOrders')}</p>
		</div>
	</div>

	<!-- Tabs -->
	<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
		<div class="flex border-b border-gray-200">
			<button
				class="flex-1 px-4 py-3 text-sm font-medium transition-colors {activeTab === 'active'
					? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
					: 'text-gray-500 hover:text-gray-700'}"
				onclick={() => { activeTab = 'active'; }}
			>
				{$t('orders.activeTab')} ({data.activeOrders.length})
			</button>
			<button
				class="flex-1 px-4 py-3 text-sm font-medium transition-colors {activeTab === 'history'
					? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
					: 'text-gray-500 hover:text-gray-700'}"
				onclick={() => { activeTab = 'history'; }}
			>
				{$t('orders.historyTab')} ({data.historyOrders.length})
			</button>
		</div>

		{#if orders.length === 0}
			<div class="p-8 text-center">
				<div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
					<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
					</svg>
				</div>
				<p class="text-gray-500">
					{activeTab === 'active' ? $t('orders.noActive') : $t('orders.noHistory')}
				</p>
			</div>
		{:else}
			<!-- Desktop Table -->
			<div class="hidden sm:block overflow-x-auto">
				<table class="w-full">
					<thead class="bg-gray-50 border-b border-gray-200">
						<tr>
							<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{$t('orders.date')}</th>
							<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{$t('orders.listing')}</th>
							<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{$t('orders.side')}</th>
							<th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{$t('orders.price')}</th>
							<th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{$t('orders.qty')}</th>
							<th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{$t('orders.filled')}</th>
							<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{$t('orders.status')}</th>
							{#if activeTab === 'active'}
								<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase"></th>
							{/if}
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						{#each orders as order}
							<tr class="hover:bg-gray-50">
								<td class="px-4 py-3 text-sm text-gray-600">{formatDate(order.createdAt)}</td>
								<td class="px-4 py-3">
									<div class="text-sm font-mono font-medium text-gray-900">{order.listingSymbol}</div>
									<div class="text-xs text-gray-500">{getName(order)}</div>
								</td>
								<td class="px-4 py-3 text-center">
									<span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium {sideColor(order.side)}">
										{sideLabel(order.side)}
									</span>
								</td>
								<td class="px-4 py-3 text-sm text-right font-mono text-gray-900">NT$ {formatCurrency(order.price)}</td>
								<td class="px-4 py-3 text-sm text-right font-mono text-gray-900">{parseFloat(order.quantity).toLocaleString()}</td>
								<td class="px-4 py-3 text-sm text-right font-mono text-gray-600">{parseFloat(order.filledQuantity).toLocaleString()}</td>
								<td class="px-4 py-3 text-center">
									<span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium {statusColor(order.status)}">
										{statusLabel(order.status)}
									</span>
								</td>
								{#if activeTab === 'active'}
									<td class="px-4 py-3 text-center">
										<button
											onclick={() => cancelOrder(order.id)}
											disabled={cancelling === order.id}
											class="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
										>
											{$t('orders.cancel')}
										</button>
									</td>
								{/if}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Mobile Cards -->
			<div class="sm:hidden divide-y divide-gray-100">
				{#each orders as order}
					<div class="p-4">
						<div class="flex justify-between items-start mb-2">
							<div>
								<span class="font-mono font-medium text-gray-900">{order.listingSymbol}</span>
								<span class="inline-flex px-1.5 py-0.5 rounded text-xs font-medium ml-2 {sideColor(order.side)}">
									{sideLabel(order.side)}
								</span>
							</div>
							<span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium {statusColor(order.status)}">
								{statusLabel(order.status)}
							</span>
						</div>
						<div class="flex justify-between text-sm text-gray-600 mb-1">
							<span>NT$ {formatCurrency(order.price)} x {parseFloat(order.quantity).toLocaleString()}</span>
							<span class="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
						</div>
						{#if activeTab === 'active'}
							<button
								onclick={() => cancelOrder(order.id)}
								disabled={cancelling === order.id}
								class="text-xs text-red-500 hover:text-red-700 font-medium mt-1 disabled:opacity-50"
							>
								{$t('orders.cancel')}
							</button>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
