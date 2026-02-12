<script lang="ts">
	import { t, locale, toggleLocale } from '$lib/i18n';

	let mobileMenuOpen = $state(false);

	const navKeys = [
		{ href: '/markets/products', key: 'nav.products' },
		{ href: '/markets/overview', key: 'nav.market' },
		{ href: '/about', key: 'nav.about' },
		{ href: '/resources/rules', key: 'nav.rules' },
		{ href: '/about/contact', key: 'nav.contact' }
	];
</script>

<header class="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200">
	<div class="container mx-auto px-4">
		<div class="flex items-center justify-between h-16">
			<!-- Logo -->
			<a href="/" class="flex items-center gap-2">
				<div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
					<span class="text-white font-bold text-sm">TX</span>
				</div>
				<span class="font-bold text-xl text-gray-900">TCEX</span>
			</a>

			<!-- Desktop Navigation -->
			<nav class="hidden md:flex items-center gap-1">
				{#each navKeys as link}
					<a
						href={link.href}
						class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
					>
						{$t(link.key)}
					</a>
				{/each}
			</nav>

			<!-- Desktop Actions -->
			<div class="hidden md:flex items-center gap-3">
				<!-- Language Toggle -->
				<button
					type="button"
					class="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
					onclick={toggleLocale}
				>
					{$t('nav.langToggle')}
				</button>

				<a
					href="/login"
					class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
				>
					{$t('nav.login')}
				</a>
				<a
					href="/register"
					class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
				>
					{$t('nav.register')}
				</a>
			</div>

			<!-- Mobile Menu Button -->
			<button
				type="button"
				class="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
				onclick={() => mobileMenuOpen = !mobileMenuOpen}
				aria-label="Toggle menu"
				aria-expanded={mobileMenuOpen}
			>
				{#if mobileMenuOpen}
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				{:else}
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				{/if}
			</button>
		</div>
	</div>

	<!-- Mobile Menu Drawer -->
	{#if mobileMenuOpen}
		<div class="md:hidden border-t border-gray-200 bg-white">
			<nav class="container mx-auto px-4 py-4 space-y-1">
				{#each navKeys as link}
					<a
						href={link.href}
						class="block px-4 py-3 text-base font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
						onclick={() => mobileMenuOpen = false}
					>
						{$t(link.key)}
					</a>
				{/each}
				<hr class="my-4 border-gray-200" />
				<button
					type="button"
					class="block w-full text-left px-4 py-3 text-base font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
					onclick={() => { toggleLocale(); mobileMenuOpen = false; }}
				>
					{$t('nav.langToggle')} — {$locale === 'zh-TW' ? 'Switch to English' : '切換至中文'}
				</button>
				<hr class="my-4 border-gray-200" />
				<div class="flex gap-3 px-4">
					<a
						href="/login"
						class="flex-1 py-3 text-center text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
					>
						{$t('nav.login')}
					</a>
					<a
						href="/register"
						class="flex-1 py-3 text-center text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
					>
						{$t('nav.register')}
					</a>
				</div>
			</nav>
		</div>
	{/if}
</header>
