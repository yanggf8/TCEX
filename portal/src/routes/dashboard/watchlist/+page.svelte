<script lang="ts">
	import { t, locale } from '$lib/i18n';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();
	let removing = $state<string | null>(null);

	function getName(item: any): string {
		return $locale === 'zh-TW' ? item.listingNameZh : item.listingNameEn;
	}

	function riskLabel(level: string): string {
		const map: Record<string, string> = {
			low: $t('listing.risk.low'),
			medium: $t('listing.risk.medium'),
			high: $t('listing.risk.high')
		};
		return map[level] || level;
	}

	function riskColor(level: string): string {
		if (level === 'low') return 'text-green-600 bg-green-50';
		if (level === 'high') return 'text-red-600 bg-red-50';
		return 'text-yellow-600 bg-yellow-50';
	}

	async function removeItem(listingId: string) {
		removing = listingId;
		try {
			const res = await fetch(`/api/v1/watchlist/${listingId}`, { method: 'DELETE' });
			if (res.ok) {
				await invalidateAll();
			}
		} finally {
			removing = null;
		}
	}
</script>

<svelte:head>
	<title>{$t('watchlist.title')} | TCEX</title>
</svelte:head>

<div class="space-y-6 pb-20 lg:pb-0">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">{$t('watchlist.title')}</h1>
		<p class="text-gray-500 mt-1">{$t('watchlist.subtitle')}</p>
	</div>

	{#if data.items.length === 0}
		<div class="bg-white rounded-xl border border-gray-200 p-8 text-center">
			<div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
				<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
				</svg>
			</div>
			<p class="text-gray-500 mb-3">{$t('watchlist.empty')}</p>
			<a href="/markets/products" class="text-primary-600 hover:text-primary-700 text-sm font-medium">
				{$t('watchlist.browseListing')}
			</a>
		</div>
	{:else}
		<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
			<!-- Desktop Table -->
			<div class="hidden sm:block overflow-x-auto">
				<table class="w-full">
					<thead class="bg-gray-50 border-b border-gray-200">
						<tr>
							<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{$t('watchlist.symbol')}</th>
							<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{$t('watchlist.name')}</th>
							<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{$t('watchlist.type')}</th>
							<th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{$t('listing.unitPrice')}</th>
							<th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{$t('listing.yieldRate')}</th>
							<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{$t('listing.riskLevel')}</th>
							<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase"></th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						{#each data.items as item}
							<tr class="hover:bg-gray-50">
								<td class="px-4 py-3 text-sm font-mono font-medium text-gray-900">{item.listingSymbol}</td>
								<td class="px-4 py-3 text-sm text-gray-700">{getName(item)}</td>
								<td class="px-4 py-3 text-sm text-gray-500 uppercase">{item.listingProductType}</td>
								<td class="px-4 py-3 text-sm text-right font-mono text-gray-900">NT$ {parseFloat(item.listingUnitPrice).toLocaleString()}</td>
								<td class="px-4 py-3 text-sm text-right text-gray-600">{item.listingYieldRate ? `${item.listingYieldRate}%` : '--'}</td>
								<td class="px-4 py-3 text-center">
									<span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium {riskColor(item.listingRiskLevel)}">
										{riskLabel(item.listingRiskLevel)}
									</span>
								</td>
								<td class="px-4 py-3 text-center">
									<button
										onclick={() => removeItem(item.listingId)}
										disabled={removing === item.listingId}
										class="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
										title={$t('watchlist.remove')}
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Mobile Cards -->
			<div class="sm:hidden divide-y divide-gray-100">
				{#each data.items as item}
					<div class="p-4">
						<div class="flex justify-between items-start mb-2">
							<div>
								<span class="font-mono font-medium text-gray-900">{item.listingSymbol}</span>
								<span class="text-sm text-gray-500 ml-2">{getName(item)}</span>
							</div>
							<button
								onclick={() => removeItem(item.listingId)}
								disabled={removing === item.listingId}
								class="text-gray-400 hover:text-red-500 transition-colors"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
						<div class="flex justify-between text-sm">
							<span class="text-gray-500">NT$ {parseFloat(item.listingUnitPrice).toLocaleString()}</span>
							<span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium {riskColor(item.listingRiskLevel)}">
								{riskLabel(item.listingRiskLevel)}
							</span>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
