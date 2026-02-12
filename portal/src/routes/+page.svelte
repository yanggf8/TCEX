<script lang="ts">
	import { t } from '$lib/i18n';
</script>

<svelte:head>
	<title>{$t('common.siteTitle')}</title>
	<meta name="description" content={$t('common.siteDesc')} />
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-primary-50 to-white">
	<!-- Section 1: Hero -->
	<section class="container mx-auto px-4 py-16 lg:py-24">
		<div class="text-center max-w-4xl mx-auto">
			<div class="inline-flex items-center gap-2 bg-primary-100 text-primary-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
				<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
				</svg>
				<span>{$t('home.badge')}</span>
			</div>

			<h1 class="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
				{$t('home.title')}
				<span class="block text-primary-600 mt-2">{$t('home.titleBrand')}</span>
			</h1>

			<p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
				{$t('home.subtitle')}
			</p>

			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<a
					href="/markets/products"
					class="inline-flex items-center justify-center px-8 py-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
				>
					{$t('home.cta.products')}
				</a>
				<a
					href="/about"
					class="inline-flex items-center justify-center px-8 py-4 border-2 border-primary-600 text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition-colors"
				>
					{$t('home.cta.learn')}
				</a>
			</div>
		</div>
	</section>

	<!-- Section 2: Stats -->
	<section class="container mx-auto px-4 py-12">
		<div class="grid grid-cols-2 md:grid-cols-4 gap-6">
			<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
				<div class="text-3xl font-bold text-primary-600">NT$--</div>
				<div class="text-gray-500 text-sm mt-1">{$t('home.stats.volume')}</div>
			</div>
			<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
				<div class="text-3xl font-bold text-primary-600">--</div>
				<div class="text-gray-500 text-sm mt-1">{$t('home.stats.listings')}</div>
			</div>
			<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
				<div class="text-3xl font-bold text-primary-600">--</div>
				<div class="text-gray-500 text-sm mt-1">{$t('home.stats.users')}</div>
			</div>
			<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
				<div class="text-3xl font-bold text-primary-600">NT$--</div>
				<div class="text-gray-500 text-sm mt-1">{$t('home.stats.dividends')}</div>
			</div>
		</div>
	</section>

	<!-- Section 3: Features -->
	<section class="container mx-auto px-4 py-16">
		<h2 class="text-3xl font-bold text-center text-gray-900 mb-12">{$t('home.features.title')}</h2>
		<div class="grid md:grid-cols-3 gap-8">
			<div class="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
				<div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
					<svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
					</svg>
				</div>
				<h3 class="text-xl font-semibold text-gray-900 mb-2">{$t('home.features.compliance.title')}</h3>
				<p class="text-gray-600">{$t('home.features.compliance.desc')}</p>
			</div>

			<div class="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
				<div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
					<svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
					</svg>
				</div>
				<h3 class="text-xl font-semibold text-gray-900 mb-2">{$t('home.features.transparency.title')}</h3>
				<p class="text-gray-600">{$t('home.features.transparency.desc')}</p>
			</div>

			<div class="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
				<div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
					<svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
					</svg>
				</div>
				<h3 class="text-xl font-semibold text-gray-900 mb-2">{$t('home.features.sme.title')}</h3>
				<p class="text-gray-600">{$t('home.features.sme.desc')}</p>
			</div>
		</div>
	</section>

	<!-- Section 4: Trust & Credibility -->
	<section class="bg-white py-16">
		<div class="container mx-auto px-4">
			<h2 class="text-3xl font-bold text-center text-gray-900 mb-4">{$t('home.trust.title')}</h2>
			<p class="text-center text-gray-500 mb-12 max-w-2xl mx-auto">{$t('home.trust.fscDesc')}</p>
			<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
				<div class="border border-gray-200 rounded-xl p-6 text-center hover:shadow-md transition-shadow">
					<div class="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg class="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
						</svg>
					</div>
					<h3 class="font-semibold text-gray-900 mb-1">{$t('home.trust.fsc')}</h3>
					<p class="text-sm text-gray-500">{$t('home.trust.fscDesc')}</p>
				</div>

				<div class="border border-gray-200 rounded-xl p-6 text-center hover:shadow-md transition-shadow">
					<div class="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg class="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
						</svg>
					</div>
					<h3 class="font-semibold text-gray-900 mb-1">{$t('home.trust.aml')}</h3>
					<p class="text-sm text-gray-500">{$t('home.trust.amlDesc')}</p>
				</div>

				<div class="border border-gray-200 rounded-xl p-6 text-center hover:shadow-md transition-shadow">
					<div class="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg class="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
						</svg>
					</div>
					<h3 class="font-semibold text-gray-900 mb-1">{$t('home.trust.custody')}</h3>
					<p class="text-sm text-gray-500">{$t('home.trust.custodyDesc')}</p>
				</div>

				<div class="border border-gray-200 rounded-xl p-6 text-center hover:shadow-md transition-shadow">
					<div class="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg class="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
						</svg>
					</div>
					<h3 class="font-semibold text-gray-900 mb-1">{$t('home.trust.audit')}</h3>
					<p class="text-sm text-gray-500">{$t('home.trust.auditDesc')}</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Section 5: Market Reach -->
	<section class="container mx-auto px-4 py-16">
		<h2 class="text-3xl font-bold text-center text-gray-900 mb-4">{$t('home.reach.title')}</h2>
		<p class="text-center text-gray-500 mb-12 max-w-2xl mx-auto">{$t('home.reach.subtitle')}</p>
		<div class="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
			<div class="relative bg-white rounded-xl p-8 shadow-sm border border-primary-200 text-center">
				<div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-medium px-3 py-1 rounded-full">
					Core
				</div>
				<div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 mt-2">
					<svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">{$t('home.reach.taiwan')}</h3>
				<p class="text-sm text-gray-500">{$t('home.reach.taiwanDesc')}</p>
			</div>

			<div class="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
				<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
					</svg>
				</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">{$t('home.reach.asiaPacific')}</h3>
				<p class="text-sm text-gray-500">{$t('home.reach.asiaPacificDesc')}</p>
			</div>

			<div class="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
				<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
					</svg>
				</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">{$t('home.reach.global')}</h3>
				<p class="text-sm text-gray-500">{$t('home.reach.globalDesc')}</p>
			</div>
		</div>
	</section>

	<!-- Section 6: Latest Updates -->
	<section class="bg-white py-16">
		<div class="container mx-auto px-4">
			<h2 class="text-3xl font-bold text-center text-gray-900 mb-12">{$t('home.updates.title')}</h2>
			<div class="max-w-3xl mx-auto">
				<div class="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
					<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
						</svg>
					</div>
					<p class="text-gray-500 mb-2">{$t('home.updates.empty')}</p>
					<p class="text-sm text-gray-400">{$t('home.updates.comingSoon')}</p>
				</div>
			</div>
		</div>
	</section>
</div>
