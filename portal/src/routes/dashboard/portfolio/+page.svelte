<script lang="ts">
	import { t, locale } from '$lib/i18n';

	let { data } = $props();

	function formatCurrency(value: string): string {
		const num = parseFloat(value || '0');
		return num.toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}

	function getName(pos: any): string {
		return $locale === 'zh-TW' ? pos.listingNameZh : pos.listingNameEn;
	}

	function pnlColor(value: string): string {
		const num = parseFloat(value);
		if (num > 0) return 'text-green-600';
		if (num < 0) return 'text-red-600';
		return 'text-gray-600';
	}

	function pnlSign(value: string): string {
		const num = parseFloat(value);
		if (num > 0) return '+';
		return '';
	}
</script>

<svelte:head>
	<title>{$t('portfolio.title')} | TCEX</title>
</svelte:head>

<div class="space-y-6 pb-20 lg:pb-0">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">{$t('portfolio.title')}</h1>
		<p class="text-gray-500 mt-1">{$t('portfolio.subtitle')}</p>
	</div>

	<!-- Summary Cards -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
		<div class="bg-white rounded-xl border border-gray-200 p-5">
			<p class="text-sm text-gray-500 mb-1">{$t('portfolio.totalValue')}</p>
			<p class="text-xl font-bold text-gray-900">NT$ {formatCurrency(data.summary.totalValue)}</p>
		</div>
		<div class="bg-white rounded-xl border border-gray-200 p-5">
			<p class="text-sm text-gray-500 mb-1">{$t('portfolio.totalCost')}</p>
			<p class="text-xl font-bold text-gray-900">NT$ {formatCurrency(data.summary.totalCost)}</p>
		</div>
		<div class="bg-white rounded-xl border border-gray-200 p-5">
			<p class="text-sm text-gray-500 mb-1">{$t('portfolio.unrealizedPnl')}</p>
			<p class="text-xl font-bold {pnlColor(data.summary.unrealizedPnl)}">
				{pnlSign(data.summary.unrealizedPnl)}NT$ {formatCurrency(data.summary.unrealizedPnl)}
			</p>
		</div>
		<div class="bg-white rounded-xl border border-gray-200 p-5">
			<p class="text-sm text-gray-500 mb-1">{$t('portfolio.positions')}</p>
			<p class="text-xl font-bold text-gray-900">{data.summary.positionCount}</p>
		</div>
	</div>

	<!-- Holdings -->
	{#if data.positions.length === 0}
		<div class="bg-white rounded-xl border border-gray-200 p-8 text-center">
			<div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
				<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
				</svg>
			</div>
			<p class="text-gray-500 mb-3">{$t('portfolio.empty')}</p>
			<a href="/markets/products" class="text-primary-600 hover:text-primary-700 text-sm font-medium">
				{$t('portfolio.startTrading')}
			</a>
		</div>
	{:else}
		<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
			<div class="hidden sm:block overflow-x-auto">
				<table class="w-full">
					<thead class="bg-gray-50 border-b border-gray-200">
						<tr>
							<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{$t('portfolio.listing')}</th>
							<th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{$t('portfolio.quantity')}</th>
							<th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{$t('portfolio.avgCost')}</th>
							<th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{$t('portfolio.currentPrice')}</th>
							<th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{$t('portfolio.marketValue')}</th>
							<th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{$t('portfolio.pnl')}</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						{#each data.positions as pos}
							{@const marketValue = (parseFloat(pos.quantity) * parseFloat(pos.listingUnitPrice)).toFixed(2)}
							{@const costBasis = (parseFloat(pos.quantity) * parseFloat(pos.averageCost)).toFixed(2)}
							{@const unrealized = (parseFloat(marketValue) - parseFloat(costBasis)).toFixed(2)}
							<tr class="hover:bg-gray-50">
								<td class="px-4 py-3">
									<div class="text-sm font-mono font-medium text-gray-900">{pos.listingSymbol}</div>
									<div class="text-xs text-gray-500">{getName(pos)}</div>
								</td>
								<td class="px-4 py-3 text-sm text-right font-mono text-gray-900">{parseFloat(pos.quantity).toLocaleString()}</td>
								<td class="px-4 py-3 text-sm text-right font-mono text-gray-600">NT$ {formatCurrency(pos.averageCost)}</td>
								<td class="px-4 py-3 text-sm text-right font-mono text-gray-900">NT$ {formatCurrency(pos.listingUnitPrice)}</td>
								<td class="px-4 py-3 text-sm text-right font-mono text-gray-900">NT$ {formatCurrency(marketValue)}</td>
								<td class="px-4 py-3 text-sm text-right font-mono {pnlColor(unrealized)}">
									{pnlSign(unrealized)}NT$ {formatCurrency(unrealized)}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Mobile Cards -->
			<div class="sm:hidden divide-y divide-gray-100">
				{#each data.positions as pos}
					{@const marketValue = (parseFloat(pos.quantity) * parseFloat(pos.listingUnitPrice)).toFixed(2)}
					{@const costBasis = (parseFloat(pos.quantity) * parseFloat(pos.averageCost)).toFixed(2)}
					{@const unrealized = (parseFloat(marketValue) - parseFloat(costBasis)).toFixed(2)}
					<div class="p-4">
						<div class="flex justify-between items-start mb-2">
							<div>
								<span class="font-mono font-medium text-gray-900">{pos.listingSymbol}</span>
								<span class="text-sm text-gray-500 ml-2">{getName(pos)}</span>
							</div>
							<span class="text-sm font-mono {pnlColor(unrealized)}">
								{pnlSign(unrealized)}NT$ {formatCurrency(unrealized)}
							</span>
						</div>
						<div class="flex justify-between text-xs text-gray-500">
							<span>{parseFloat(pos.quantity).toLocaleString()} {$t('portfolio.units')}</span>
							<span>NT$ {formatCurrency(marketValue)}</span>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
