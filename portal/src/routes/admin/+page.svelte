<script lang="ts">
	let { data } = $props();
	const { stats } = data;

	const now = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
</script>

<svelte:head><title>Admin Overview · TCEX</title></svelte:head>

<!-- Header -->
<div class="flex items-baseline justify-between mb-8">
	<div>
		<div class="text-[10px] text-[#52525b] tracking-[0.2em] mb-1">CONTROL PANEL</div>
		<h1 class="text-2xl font-light text-[#fafafa] tracking-tight">System Overview</h1>
	</div>
	<div class="text-[10px] text-[#3f3f46] tracking-wider">{now}</div>
</div>

<!-- Stats Grid -->
<div class="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#27272a] border border-[#27272a] mb-8">
	<div class="bg-[#09090b] p-6">
		<div class="text-[9px] tracking-[0.25em] text-[#52525b] mb-3">TOTAL USERS</div>
		<div class="text-4xl font-light text-[#fafafa] tabular-nums">{stats.userCount.toLocaleString()}</div>
		<div class="mt-3 h-px bg-[#18181b]"></div>
		<div class="mt-2 text-[10px] text-[#3f3f46]">registered accounts</div>
	</div>

	<div class="bg-[#09090b] p-6 relative overflow-hidden">
		{#if stats.pendingKyc > 0}
			<div class="absolute top-0 right-0 w-1 h-full bg-amber-500"></div>
		{/if}
		<div class="text-[9px] tracking-[0.25em] text-[#52525b] mb-3">PENDING KYC</div>
		<div class="text-4xl font-light tabular-nums {stats.pendingKyc > 0 ? 'text-amber-400' : 'text-[#fafafa]'}">
			{stats.pendingKyc}
		</div>
		<div class="mt-3 h-px bg-[#18181b]"></div>
		<div class="mt-2 text-[10px] {stats.pendingKyc > 0 ? 'text-amber-500/60' : 'text-[#3f3f46]'}">
			{stats.pendingKyc > 0 ? 'requires review' : 'queue clear'}
		</div>
	</div>

	<div class="bg-[#09090b] p-6">
		<div class="text-[9px] tracking-[0.25em] text-[#52525b] mb-3">TOTAL TRADES</div>
		<div class="text-4xl font-light text-[#fafafa] tabular-nums">{stats.totalTrades.toLocaleString()}</div>
		<div class="mt-3 h-px bg-[#18181b]"></div>
		<div class="mt-2 text-[10px] text-[#3f3f46]">executed matches</div>
	</div>

	<div class="bg-[#09090b] p-6">
		<div class="text-[9px] tracking-[0.25em] text-[#52525b] mb-3">ACTIVE ORDERS</div>
		<div class="text-4xl font-light text-[#fafafa] tabular-nums">{stats.activeOrders}</div>
		<div class="mt-3 h-px bg-[#18181b]"></div>
		<div class="mt-2 text-[10px] text-[#3f3f46]">open in orderbook</div>
	</div>
</div>

<!-- Quick Actions -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
	<a href="/admin/kyc" class="group border border-[#27272a] bg-[#09090b] p-6 hover:border-amber-500/40 hover:bg-[#0f0f10] transition-all duration-200">
		<div class="flex items-start justify-between mb-4">
			<div class="text-[9px] tracking-[0.25em] text-[#52525b]">MODULE</div>
			<div class="text-[10px] text-[#27272a] group-hover:text-amber-500/40 transition-colors">→</div>
		</div>
		<div class="text-lg font-light text-[#fafafa] mb-2 group-hover:text-amber-400 transition-colors">KYC Review</div>
		<div class="text-[11px] text-[#52525b] leading-relaxed">
			Review identity verification applications. Approve or reject L2 upgrade requests with audit trail.
		</div>
		{#if stats.pendingKyc > 0}
			<div class="mt-4 inline-flex items-center gap-2">
				<div class="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></div>
				<span class="text-[10px] text-amber-400 tracking-wider">{stats.pendingKyc} PENDING</span>
			</div>
		{/if}
	</a>

	<a href="/admin/users" class="group border border-[#27272a] bg-[#09090b] p-6 hover:border-[#3f3f46] hover:bg-[#0f0f10] transition-all duration-200">
		<div class="flex items-start justify-between mb-4">
			<div class="text-[9px] tracking-[0.25em] text-[#52525b]">MODULE</div>
			<div class="text-[10px] text-[#27272a] group-hover:text-[#71717a] transition-colors">→</div>
		</div>
		<div class="text-lg font-light text-[#fafafa] mb-2 group-hover:text-[#d4d4d8] transition-colors">User Management</div>
		<div class="text-[11px] text-[#52525b] leading-relaxed">
			Browse registered accounts. Search by email or name. Freeze or unfreeze user accounts.
		</div>
		<div class="mt-4 text-[10px] text-[#3f3f46] tracking-wider">{stats.userCount} ACCOUNTS</div>
	</a>
</div>
