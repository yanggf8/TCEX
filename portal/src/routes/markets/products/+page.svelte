<script lang="ts">
	import { t } from '$lib/i18n';

	const products = [
		{
			titleKey: 'products.rbo.title',
			descKey: 'products.rbo.desc',
			features: ['products.rbo.f1', 'products.rbo.f2', 'products.rbo.f3'],
			icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
			color: 'primary'
		},
		{
			titleKey: 'products.spv.title',
			descKey: 'products.spv.desc',
			features: ['products.spv.f1', 'products.spv.f2', 'products.spv.f3'],
			icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
			color: 'primary'
		},
		{
			titleKey: 'products.spac.title',
			descKey: 'products.spac.desc',
			features: ['products.spac.f1', 'products.spac.f2', 'products.spac.f3'],
			icon: 'M13 10V3L4 14h7v7l9-11h-7z',
			color: 'primary'
		}
	];
</script>

<svelte:head>
	<title>{$t('products.title')} | TCEX</title>
	<meta name="description" content={$t('products.subtitle')} />
</svelte:head>

<div class="container mx-auto px-4 py-12">
	<div class="text-center mb-12">
		<h1 class="text-3xl font-bold text-gray-900 mb-4">{$t('products.title')}</h1>
		<p class="text-gray-600 max-w-2xl mx-auto">{$t('products.subtitle')}</p>
	</div>

	<!-- Product Cards -->
	<div class="grid md:grid-cols-3 gap-8 mb-12">
		{#each products as product}
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
				<div class="p-8">
					<div class="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mb-6">
						<svg class="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={product.icon} />
						</svg>
					</div>
					<h2 class="text-xl font-semibold text-gray-900 mb-3">{$t(product.titleKey)}</h2>
					<p class="text-gray-600 text-sm mb-6">{$t(product.descKey)}</p>

					<ul class="space-y-2 mb-6">
						{#each product.features as featureKey}
							<li class="flex items-center gap-2 text-sm text-gray-600">
								<svg class="w-4 h-4 text-primary-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
								</svg>
								{$t(featureKey)}
							</li>
						{/each}
					</ul>

					<button
						type="button"
						class="w-full py-3 text-center text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors cursor-default"
					>
						{$t('products.learnMore')}
					</button>
				</div>
			</div>
		{/each}
	</div>

	<!-- Risk Disclosure -->
	<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-3xl mx-auto">
		<div class="flex gap-3">
			<svg class="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
			</svg>
			<div>
				<h3 class="font-semibold text-yellow-800 mb-1">{$t('products.riskTitle')}</h3>
				<p class="text-yellow-700 text-sm">{$t('products.riskText')}</p>
			</div>
		</div>
	</div>
</div>
