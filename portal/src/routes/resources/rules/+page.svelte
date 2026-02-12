<script lang="ts">
	import { t } from '$lib/i18n';
</script>

<svelte:head>
	<title>{$t('rules.title')} | TCEX</title>
	<meta name="description" content={$t('rules.subtitle')} />
</svelte:head>

<div class="container mx-auto px-4 py-12">
	<h1 class="text-3xl font-bold text-gray-900 mb-4">{$t('rules.title')}</h1>

	<div class="max-w-3xl">
		<p class="text-gray-600 text-lg mb-8">{$t('rules.subtitle')}</p>

		<!-- Risk Warning -->
		<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
			<div class="flex gap-3">
				<svg class="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
				<div>
					<h3 class="font-semibold text-yellow-800 mb-1">{$t('rules.riskTitle')}</h3>
					<p class="text-yellow-700 text-sm">{$t('rules.riskText')}</p>
				</div>
			</div>
		</div>

		<!-- Trading Hours -->
		<section class="mb-8">
			<h2 class="text-2xl font-semibold text-gray-900 mb-4">{$t('rules.tradingHours')}</h2>
			<p class="text-gray-600">{$t('rules.tradingHoursNotice')}</p>
		</section>

		<!-- Fee Structure -->
		<section class="mb-8">
			<h2 class="text-2xl font-semibold text-gray-900 mb-4">{$t('rules.fees')}</h2>
			<p class="text-gray-600">{$t('rules.feesNotice')}</p>
		</section>

		<!-- Investor Eligibility -->
		<section class="mb-8">
			<h2 class="text-2xl font-semibold text-gray-900 mb-4">{$t('rules.eligibility.title')}</h2>
			<p class="text-gray-600 mb-4">{$t('rules.eligibility.desc')}</p>
			<ul class="space-y-2">
				<li class="flex items-start gap-2 text-gray-600">
					<svg class="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
					</svg>
					{$t('rules.eligibility.item1')}
				</li>
				<li class="flex items-start gap-2 text-gray-600">
					<svg class="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
					</svg>
					{$t('rules.eligibility.item2')}
				</li>
				<li class="flex items-start gap-2 text-gray-600">
					<svg class="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
					</svg>
					{$t('rules.eligibility.item3')}
				</li>
			</ul>
			<p class="text-sm text-gray-400 mt-3">{$t('rules.comingSoon')}</p>
		</section>

		<!-- Order Types -->
		<section class="mb-8">
			<h2 class="text-2xl font-semibold text-gray-900 mb-4">{$t('rules.orderTypes.title')}</h2>
			<p class="text-gray-600 mb-4">{$t('rules.orderTypes.desc')}</p>
			<ul class="space-y-2">
				<li class="flex items-start gap-2 text-gray-600">
					<svg class="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
					</svg>
					{$t('rules.orderTypes.item1')}
				</li>
				<li class="flex items-start gap-2 text-gray-600">
					<svg class="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
					</svg>
					{$t('rules.orderTypes.item2')}
				</li>
			</ul>
			<p class="text-sm text-gray-400 mt-3">{$t('rules.comingSoon')}</p>
		</section>

		<!-- Settlement -->
		<section class="mb-8">
			<h2 class="text-2xl font-semibold text-gray-900 mb-4">{$t('rules.settlement.title')}</h2>
			<p class="text-gray-600 mb-4">{$t('rules.settlement.desc')}</p>
			<ul class="space-y-2">
				<li class="flex items-start gap-2 text-gray-600">
					<svg class="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
					</svg>
					{$t('rules.settlement.item1')}
				</li>
				<li class="flex items-start gap-2 text-gray-600">
					<svg class="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
					</svg>
					{$t('rules.settlement.item2')}
				</li>
				<li class="flex items-start gap-2 text-gray-600">
					<svg class="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
					</svg>
					{$t('rules.settlement.item3')}
				</li>
			</ul>
			<p class="text-sm text-gray-400 mt-3">{$t('rules.comingSoon')}</p>
		</section>

		<!-- Pending Notice -->
		<section class="bg-primary-50 border border-primary-200 rounded-lg p-8">
			<h2 class="text-xl font-semibold text-gray-900 mb-2">{$t('rules.pending')}</h2>
			<p class="text-gray-600">{$t('rules.pendingNotice')}</p>
		</section>
	</div>
</div>
