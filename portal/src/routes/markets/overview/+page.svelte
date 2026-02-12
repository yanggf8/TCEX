<script lang="ts">
	import { t } from '$lib/i18n';

	let { data } = $props();
</script>

<svelte:head>
	<title>{$t('market.title')} | TCEX</title>
	<meta name="description" content={$t('market.subtitle')} />
</svelte:head>

<div class="container mx-auto px-4 py-12">
	<div class="mb-12">
		<h1 class="text-3xl font-bold text-gray-900 mb-4">{$t('market.title')}</h1>
		<p class="text-gray-600">{$t('market.subtitle')}</p>
	</div>

	<!-- Market Overview Stats -->
	<section class="mb-12">
		<h2 class="text-xl font-semibold text-gray-900 mb-6">{$t('market.overview')}</h2>
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
			<div class="bg-white rounded-xl p-6 border border-gray-200">
				<p class="text-sm text-gray-500 mb-1">{$t('market.totalVolume')}</p>
				<p class="text-2xl font-bold text-gray-900">{$t('market.placeholder')}</p>
			</div>
			<div class="bg-white rounded-xl p-6 border border-gray-200">
				<p class="text-sm text-gray-500 mb-1">{$t('market.totalListings')}</p>
				<p class="text-2xl font-bold text-gray-900">{data.stats.totalListings}</p>
			</div>
			<div class="bg-white rounded-xl p-6 border border-gray-200">
				<p class="text-sm text-gray-500 mb-1">{$t('market.totalInvestors')}</p>
				<p class="text-2xl font-bold text-gray-900">{$t('market.placeholder')}</p>
			</div>
			<div class="bg-white rounded-xl p-6 border border-gray-200">
				<p class="text-sm text-gray-500 mb-1">{$t('market.avgReturn')}</p>
				<p class="text-2xl font-bold text-gray-900">{$t('market.placeholder')}</p>
			</div>
		</div>
	</section>

	<!-- Listing Breakdown by Type -->
	{#if data.stats.totalListings > 0}
		<section class="mb-12">
			<h2 class="text-xl font-semibold text-gray-900 mb-6">{$t('market.listingBreakdown')}</h2>
			<div class="grid grid-cols-3 gap-4">
				<div class="bg-white rounded-xl p-6 border border-gray-200 text-center">
					<p class="text-sm text-gray-500 mb-1">RBO</p>
					<p class="text-2xl font-bold text-primary-600">{data.stats.rboCount}</p>
				</div>
				<div class="bg-white rounded-xl p-6 border border-gray-200 text-center">
					<p class="text-sm text-gray-500 mb-1">SPV</p>
					<p class="text-2xl font-bold text-primary-600">{data.stats.spvCount}</p>
				</div>
				<div class="bg-white rounded-xl p-6 border border-gray-200 text-center">
					<p class="text-sm text-gray-500 mb-1">SPAC</p>
					<p class="text-2xl font-bold text-primary-600">{data.stats.spacCount}</p>
				</div>
			</div>
		</section>
	{/if}

	<!-- Trading Hours -->
	<section class="mb-12">
		<h2 class="text-xl font-semibold text-gray-900 mb-6">{$t('market.tradingHours.title')}</h2>
		<div class="bg-white rounded-xl border border-gray-200 p-6">
			<div class="flex items-start gap-3">
				<svg class="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<div>
					<p class="text-gray-600 mb-2">{$t('market.tradingHours.notice')}</p>
					<div class="text-sm text-gray-500 space-y-1">
						<p>{$t('market.tradingHours.weekday')}: 09:00 - 13:30 (TST)</p>
						<p>{$t('market.tradingHours.holiday')}</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Fee Overview -->
	<section class="mb-12">
		<h2 class="text-xl font-semibold text-gray-900 mb-6">{$t('market.fees.title')}</h2>
		<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
			<table class="w-full">
				<thead class="bg-gray-50">
					<tr>
						<th class="text-left px-6 py-3 text-sm font-medium text-gray-500">{$t('market.fees.type')}</th>
						<th class="text-left px-6 py-3 text-sm font-medium text-gray-500">{$t('market.fees.rate')}</th>
						<th class="text-left px-6 py-3 text-sm font-medium text-gray-500">{$t('market.fees.note')}</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					<tr>
						<td class="px-6 py-4 text-sm text-gray-900">{$t('market.fees.trading')}</td>
						<td class="px-6 py-4 text-sm text-gray-500">{$t('market.fees.tbd')}</td>
						<td class="px-6 py-4 text-sm text-gray-500">-</td>
					</tr>
					<tr>
						<td class="px-6 py-4 text-sm text-gray-900">{$t('market.fees.management')}</td>
						<td class="px-6 py-4 text-sm text-gray-500">{$t('market.fees.tbd')}</td>
						<td class="px-6 py-4 text-sm text-gray-500">-</td>
					</tr>
					<tr>
						<td class="px-6 py-4 text-sm text-gray-900">{$t('market.fees.withdrawal')}</td>
						<td class="px-6 py-4 text-sm text-gray-500">{$t('market.fees.tbd')}</td>
						<td class="px-6 py-4 text-sm text-gray-500">-</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<!-- Trading Calendar -->
	<section>
		<h2 class="text-xl font-semibold text-gray-900 mb-6">{$t('market.calendar.title')}</h2>
		<div class="bg-primary-50 border border-primary-200 rounded-lg p-8 text-center">
			<div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
				<svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
				</svg>
			</div>
			<p class="text-gray-600">{$t('market.calendar.notice')}</p>
		</div>
	</section>
</div>
