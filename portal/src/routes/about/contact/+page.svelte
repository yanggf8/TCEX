<script lang="ts">
	import { t } from '$lib/i18n';
</script>

<svelte:head>
	<title>{$t('contact.title')} | TCEX</title>
	<meta name="description" content={$t('contact.subtitle')} />
</svelte:head>

<div class="container mx-auto px-4 py-12">
	<h1 class="text-3xl font-bold text-gray-900 mb-4">{$t('contact.title')}</h1>
	<p class="text-gray-600 mb-8">{$t('contact.subtitle')}</p>

	<div class="grid md:grid-cols-2 gap-12 max-w-4xl">
		<!-- Contact Info -->
		<div>
			<div class="space-y-4">
				<div class="flex items-start gap-4">
					<div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
						<svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
						</svg>
					</div>
					<div>
						<h3 class="font-medium text-gray-900">{$t('login.email')}</h3>
						<a href="mailto:contact@tcex.tw" class="text-primary-600 hover:text-primary-700">
							contact@tcex.tw
						</a>
					</div>
				</div>

				<div class="flex items-start gap-4">
					<div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
						<svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
					</div>
					<div>
						<h3 class="font-medium text-gray-900">{$t('footer.address')}</h3>
						<p class="text-gray-600">{$t('footer.address')}</p>
					</div>
				</div>
			</div>

			<div class="mt-8 p-6 bg-gray-50 rounded-lg">
				<h3 class="font-medium text-gray-900 mb-2">{$t('market.tradingHours.weekday')}</h3>
				<p class="text-gray-600 text-sm">09:00 - 18:00</p>
			</div>
		</div>

		<!-- Contact Form Placeholder -->
		<div>
			<div class="bg-primary-50 border border-primary-200 rounded-lg p-8 text-center">
				<div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
					</svg>
				</div>
				<p class="text-gray-600 text-sm">{$t('common.comingSoon')}</p>
			</div>
		</div>
	</div>
</div>
