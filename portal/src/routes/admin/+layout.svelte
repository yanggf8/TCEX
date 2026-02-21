<script lang="ts">
	import { page } from '$app/state';
	let { children, data } = $props();

	const navItems = [
		{ href: '/admin', label: 'OVERVIEW', exact: true },
		{ href: '/admin/kyc', label: 'KYC REVIEW' },
		{ href: '/admin/users', label: 'USERS' }
	];

	function isActive(href: string, exact = false) {
		return exact ? page.url.pathname === href : page.url.pathname.startsWith(href);
	}
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&display=swap" rel="stylesheet" />
</svelte:head>

<div class="admin-root min-h-screen bg-[#09090b] text-[#fafafa]">
	<!-- Top Bar -->
	<header class="border-b border-[#27272a] bg-[#09090b] sticky top-0 z-50">
		<div class="flex items-center h-12 px-6 gap-8">
			<!-- Brand -->
			<div class="flex items-center gap-3 shrink-0">
				<div class="w-6 h-6 bg-amber-500 flex items-center justify-center">
					<span class="text-black text-xs font-semibold">TX</span>
				</div>
				<span class="text-[11px] font-semibold tracking-[0.2em] text-[#a1a1aa]">TCEX / ADMIN</span>
			</div>

			<!-- Divider -->
			<div class="w-px h-5 bg-[#27272a]"></div>

			<!-- Nav -->
			<nav class="flex items-center gap-1">
				{#each navItems as item}
					<a
						href={item.href}
						class="px-3 h-8 flex items-center text-[10px] font-medium tracking-[0.15em] transition-all
							{isActive(item.href, item.exact)
								? 'text-amber-400 bg-amber-500/10 border border-amber-500/30'
								: 'text-[#71717a] hover:text-[#fafafa] border border-transparent hover:bg-[#18181b]'}"
					>
						{item.label}
					</a>
				{/each}
			</nav>

			<!-- Right -->
			<div class="ml-auto flex items-center gap-4">
				<span class="text-[10px] text-[#52525b] tracking-wider">{data?.adminEmail ?? ''}</span>
				<div class="w-px h-4 bg-[#27272a]"></div>
				<a href="/dashboard" class="text-[10px] tracking-[0.1em] text-[#52525b] hover:text-amber-400 transition-colors">
					← PLATFORM
				</a>
			</div>
		</div>
	</header>

	<!-- Content -->
	<main class="px-6 py-8 max-w-7xl mx-auto">
		{@render children()}
	</main>
</div>

<style>
	:global(.admin-root *) {
		font-family: 'IBM Plex Mono', 'Courier New', monospace;
	}
</style>
