<script lang="ts">
	import { page } from '$app/stores';
	import { t } from '$lib/i18n';

	let { children } = $props();

	const navItems = [
		{ href: '/dashboard', key: 'dashboard.nav.overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
		{ href: '/dashboard/portfolio', key: 'dashboard.nav.portfolio', icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z' },
		{ href: '/dashboard/orders', key: 'dashboard.nav.orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
		{ href: '/dashboard/wallet', key: 'dashboard.nav.wallet', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
		{ href: '/dashboard/watchlist', key: 'dashboard.nav.watchlist', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
		{ href: '/dashboard/distributions', key: 'dashboard.nav.distributions', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
		{ href: '/dashboard/settings', key: 'dashboard.nav.settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
	];

	function isActive(href: string, pathname: string): boolean {
		if (href === '/dashboard') return pathname === '/dashboard';
		return pathname.startsWith(href);
	}
</script>

<div class="min-h-[calc(100vh-4rem)] bg-gray-50">
	<div class="container mx-auto px-4 py-6">
		<div class="flex gap-6">
			<!-- Desktop Sidebar -->
			<aside class="hidden lg:block w-60 flex-shrink-0">
				<nav class="bg-white rounded-xl border border-gray-200 p-3 sticky top-20">
					{#each navItems as item}
						<a
							href={item.href}
							class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors {isActive(item.href, $page.url.pathname)
								? 'bg-primary-50 text-primary-700'
								: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
						>
							<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
							</svg>
							{$t(item.key)}
						</a>
					{/each}
				</nav>
			</aside>

			<!-- Main Content -->
			<div class="flex-1 min-w-0">
				{@render children()}
			</div>
		</div>
	</div>

	<!-- Mobile Bottom Tab Bar -->
	<nav class="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
		<div class="flex justify-around items-center h-16 px-2">
			{#each navItems.slice(0, 5) as item}
				<a
					href={item.href}
					class="flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-xs {isActive(item.href, $page.url.pathname)
						? 'text-primary-600'
						: 'text-gray-500'}"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
					</svg>
					<span class="truncate">{$t(item.key)}</span>
				</a>
			{/each}
		</div>
	</nav>
</div>
