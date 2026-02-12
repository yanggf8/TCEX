<script lang="ts">
	import { t, locale } from '$lib/i18n';

	let { data } = $props();

	function getName(item: any): string {
		return $locale === 'zh-TW' ? item.listingNameZh : item.listingNameEn;
	}

	function formatCurrency(value: string): string {
		const num = parseFloat(value || '0');
		return num.toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}

	function formatDate(iso: string | null): string {
		if (!iso) return '--';
		return new Date(iso).toLocaleDateString('zh-TW', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>{$t('distributions.title')} | TCEX</title>
</svelte:head>

<div class="space-y-6 pb-20 lg:pb-0">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">{$t('distributions.title')}</h1>
		<p class="text-gray-500 mt-1">{$t('distributions.subtitle')}</p>
	</div>

	<!-- User's Payments -->
	<div>
		<h2 class="text-lg font-semibold text-gray-900 mb-3">{$t('distributions.myPayments')}</h2>
		{#if data.userPayments.length === 0}
			<div class="bg-white rounded-xl border border-gray-200 p-8 text-center">
				<div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
					<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<p class="text-gray-500">{$t('distributions.noPayments')}</p>
				<p class="text-sm text-gray-400 mt-1">{$t('distributions.noPaymentsHint')}</p>
			</div>
		{:else}
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-gray-50 border-b border-gray-200">
							<tr>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{$t('distributions.listing')}</th>
								<th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{$t('distributions.unitsHeld')}</th>
								<th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{$t('distributions.amount')}</th>
								<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{$t('distributions.status')}</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{$t('distributions.date')}</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-100">
							{#each data.userPayments as payment}
								<tr class="hover:bg-gray-50">
									<td class="px-4 py-3 text-sm">
										<span class="font-mono font-medium">{payment.listingSymbol}</span>
										<span class="text-gray-500 ml-1">{getName(payment)}</span>
									</td>
									<td class="px-4 py-3 text-sm text-right font-mono">{parseFloat(payment.unitsHeld).toLocaleString()}</td>
									<td class="px-4 py-3 text-sm text-right font-mono text-green-600">+NT$ {formatCurrency(payment.amount)}</td>
									<td class="px-4 py-3 text-center">
										<span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium {payment.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}">
											{payment.status === 'paid' ? $t('distributions.paid') : $t('distributions.pending')}
										</span>
									</td>
									<td class="px-4 py-3 text-sm text-gray-500">{formatDate(payment.paidAt || payment.createdAt)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</div>

	<!-- Upcoming Distributions -->
	<div>
		<h2 class="text-lg font-semibold text-gray-900 mb-3">{$t('distributions.upcoming')}</h2>
		{#if data.upcoming.length === 0}
			<div class="bg-white rounded-xl border border-gray-200 p-6 text-center">
				<p class="text-gray-500">{$t('distributions.noUpcoming')}</p>
			</div>
		{:else}
			<div class="grid gap-4">
				{#each data.upcoming as dist}
					<div class="bg-white rounded-xl border border-gray-200 p-5">
						<div class="flex justify-between items-start">
							<div>
								<span class="font-mono font-medium text-gray-900">{dist.listingSymbol}</span>
								<span class="text-sm text-gray-500 ml-2">{getName(dist)}</span>
							</div>
							<span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
								{dist.status === 'announced' ? $t('distributions.announced') : $t('distributions.scheduled')}
							</span>
						</div>
						<div class="mt-3 grid grid-cols-3 gap-4 text-sm">
							<div>
								<p class="text-gray-500">{$t('distributions.perUnit')}</p>
								<p class="font-mono font-medium">NT$ {formatCurrency(dist.amountPerUnit)}</p>
							</div>
							<div>
								<p class="text-gray-500">{$t('distributions.recordDate')}</p>
								<p class="font-medium">{formatDate(dist.recordDate)}</p>
							</div>
							<div>
								<p class="text-gray-500">{$t('distributions.paymentDate')}</p>
								<p class="font-medium">{formatDate(dist.paymentDate)}</p>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Past Distributions -->
	{#if data.past.length > 0}
		<div>
			<h2 class="text-lg font-semibold text-gray-900 mb-3">{$t('distributions.past')}</h2>
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-gray-50 border-b border-gray-200">
							<tr>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{$t('distributions.listing')}</th>
								<th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{$t('distributions.perUnit')}</th>
								<th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{$t('distributions.total')}</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{$t('distributions.paymentDate')}</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-100">
							{#each data.past as dist}
								<tr class="hover:bg-gray-50">
									<td class="px-4 py-3 text-sm font-mono font-medium">{dist.listingSymbol}</td>
									<td class="px-4 py-3 text-sm text-right font-mono">NT$ {formatCurrency(dist.amountPerUnit)}</td>
									<td class="px-4 py-3 text-sm text-right font-mono">NT$ {formatCurrency(dist.totalAmount)}</td>
									<td class="px-4 py-3 text-sm text-gray-500">{formatDate(dist.paymentDate)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}
</div>
