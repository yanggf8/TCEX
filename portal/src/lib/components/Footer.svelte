<script lang="ts">
	import { t, locale, toggleLocale } from '$lib/i18n';

	const currentYear = new Date().getFullYear();

	const quickLinks = [
		{ href: '/market', key: 'nav.market' },
		{ href: '/products', key: 'nav.products' },
		{ href: '/rules', key: 'nav.rules' },
		{ href: '/about', key: 'nav.about' },
		{ href: '/contact', key: 'nav.contact' }
	];
</script>

<footer class="bg-gray-900 text-gray-300">
	<div class="container mx-auto px-4 py-12">
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
			<!-- Column 1: Brand + Description + FSC Badge -->
			<div>
				<a href="/" class="flex items-center gap-2 mb-4">
					<div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
						<span class="text-white font-bold text-sm">TX</span>
					</div>
					<span class="font-bold text-xl text-white">TCEX</span>
				</a>
				<p class="text-sm text-gray-400 mb-4">
					{$t('footer.desc')}
				</p>
				<div class="inline-flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-full text-xs">
					<svg class="w-4 h-4 text-primary-400" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
					</svg>
					<span class="text-gray-300">{$t('footer.fscBadge')}</span>
				</div>
			</div>

			<!-- Column 2: Quick Links -->
			<div>
				<h3 class="font-semibold text-white mb-4">{$t('footer.col.quickLinks')}</h3>
				<ul class="space-y-2">
					{#each quickLinks as link}
						<li>
							<a href={link.href} class="text-sm hover:text-white transition-colors">
								{$t(link.key)}
							</a>
						</li>
					{/each}
				</ul>
			</div>

			<!-- Column 3: Contact Info -->
			<div>
				<h3 class="font-semibold text-white mb-4">{$t('footer.col.contact')}</h3>
				<ul class="space-y-3">
					<li class="flex items-start gap-2">
						<svg class="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
						</svg>
						<a href="mailto:contact@tcex.tw" class="text-sm hover:text-white transition-colors">
							{$t('footer.email')}
						</a>
					</li>
					<li class="flex items-start gap-2">
						<svg class="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
						</svg>
						<span class="text-sm">{$t('footer.phone')}</span>
					</li>
					<li class="flex items-start gap-2">
						<svg class="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
						<span class="text-sm">{$t('footer.address')}</span>
					</li>
				</ul>
			</div>

			<!-- Column 4: Social + Newsletter -->
			<div>
				<h3 class="font-semibold text-white mb-4">{$t('footer.col.follow')}</h3>
				<!-- Social Links -->
				<div class="flex gap-3 mb-6">
					<!-- LINE -->
					<a href="#" class="w-9 h-9 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors" aria-label="LINE">
						<svg class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
							<path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
						</svg>
					</a>
					<!-- LinkedIn -->
					<a href="#" class="w-9 h-9 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors" aria-label="LinkedIn">
						<svg class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
							<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
						</svg>
					</a>
				</div>
				<!-- Newsletter Signup -->
				<p class="text-sm text-gray-400 mb-2">{$t('footer.newsletter')}</p>
				<form class="flex gap-2" onsubmit={(e) => e.preventDefault()}>
					<input
						type="email"
						placeholder={$t('footer.newsletterPlaceholder')}
						class="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
					/>
					<button
						type="submit"
						class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
					>
						{$t('footer.subscribe')}
					</button>
				</form>
			</div>
		</div>

		<!-- Risk Disclosure -->
		<div class="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-800">
			<p class="text-xs text-gray-500 text-center">
				{$t('footer.risk')}
			</p>
		</div>

		<!-- Bottom Bar -->
		<div class="border-t border-gray-800 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
			<p class="text-sm text-gray-500">
				&copy; {currentYear} {$t('footer.copyright')}
			</p>
			<div class="flex items-center gap-4 text-sm">
				<a href="/rules" class="text-gray-400 hover:text-white transition-colors">{$t('footer.disclaimer')}</a>
				<span class="text-gray-700">|</span>
				<a href="/rules" class="text-gray-400 hover:text-white transition-colors">{$t('footer.terms')}</a>
				<span class="text-gray-700">|</span>
				<a href="/rules" class="text-gray-400 hover:text-white transition-colors">{$t('footer.privacy')}</a>
				<span class="text-gray-700">|</span>
				<button
					type="button"
					class="text-gray-400 hover:text-white transition-colors"
					onclick={toggleLocale}
				>
					{$locale === 'zh-TW' ? 'English' : '中文'}
				</button>
			</div>
		</div>
	</div>
</footer>
