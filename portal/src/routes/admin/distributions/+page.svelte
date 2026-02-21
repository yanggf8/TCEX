<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	let { data } = $props();

	let selectedListing = $state('');
	let revenueAmount = $state('');
	let description = $state('');
	let processing = $state(false);
	let error = $state('');
	let success = $state('');

	async function execute() {
		if (!selectedListing || !revenueAmount) {
			error = 'MISSING_FIELDS';
			return;
		}
		const amount = parseFloat(revenueAmount);
		if (isNaN(amount) || amount <= 0) {
			error = 'INVALID_AMOUNT';
			return;
		}

		processing = true;
		error = '';
		success = '';
		try {
			const res = await fetch('/api/v1/admin/distributions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					listingId: selectedListing,
					totalRevenue: revenueAmount,
					description: description.trim() || null
				})
			});
			const d = await res.json() as any;
			if (!res.ok) {
				error = d.error?.code || 'OPERATION_FAILED';
				return;
			}
			success = `DISTRIBUTED — NT$ ${parseFloat(d.totalAmount).toLocaleString()} → ${d.recipientCount} holders`;
			selectedListing = '';
			revenueAmount = '';
			description = '';
			await invalidateAll();
		} catch {
			error = 'NETWORK_ERROR';
		} finally {
			processing = false;
		}
	}
</script>

<svelte:head><title>Distributions · TCEX Admin</title></svelte:head>

<!-- Header -->
<div class="flex items-baseline justify-between mb-6">
	<div>
		<div class="text-[10px] text-[#52525b] tracking-[0.2em] mb-1">REVENUE ENGINE</div>
		<h1 class="text-2xl font-light tracking-tight">Distributions</h1>
	</div>
	<div class="text-[11px] text-[#52525b]">{data.recent.length} RECENT</div>
</div>

<!-- Execute Distribution -->
<div class="border border-[#27272a] bg-[#09090b] p-6 mb-6">
	<div class="text-[9px] tracking-[0.25em] text-[#52525b] mb-4">EXECUTE DISTRIBUTION</div>

	{#if error}
		<div class="mb-4 px-4 py-2 border border-red-500/30 bg-red-500/5 text-[11px] text-red-400 tracking-wider">
			ERR: {error}
		</div>
	{/if}
	{#if success}
		<div class="mb-4 px-4 py-2 border border-emerald-500/30 bg-emerald-500/5 text-[11px] text-emerald-400 tracking-wider">
			✓ {success}
		</div>
	{/if}

	<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
		<!-- Listing -->
		<div>
			<div class="text-[9px] tracking-[0.2em] text-[#3f3f46] mb-1.5">LISTING</div>
			<select
				bind:value={selectedListing}
				class="w-full bg-[#0f0f10] border border-[#27272a] px-3 py-2 text-[12px] text-[#a1a1aa] focus:outline-none focus:border-[#52525b] appearance-none"
			>
				<option value="">— select listing —</option>
				{#each data.listings as l}
					<option value={l.id}>{l.symbol} · {l.name_zh}</option>
				{/each}
			</select>
		</div>

		<!-- Revenue Amount -->
		<div>
			<div class="text-[9px] tracking-[0.2em] text-[#3f3f46] mb-1.5">TOTAL REVENUE (TWD)</div>
			<input
				type="number"
				bind:value={revenueAmount}
				placeholder="e.g. 100000"
				min="1"
				step="1"
				class="w-full bg-[#0f0f10] border border-[#27272a] px-3 py-2 text-[12px] text-[#a1a1aa] placeholder-[#3f3f46] focus:outline-none focus:border-[#52525b]"
			/>
		</div>

		<!-- Description -->
		<div>
			<div class="text-[9px] tracking-[0.2em] text-[#3f3f46] mb-1.5">DESCRIPTION (optional)</div>
			<input
				type="text"
				bind:value={description}
				placeholder="e.g. 2026-02 月收入分成"
				class="w-full bg-[#0f0f10] border border-[#27272a] px-3 py-2 text-[12px] text-[#a1a1aa] placeholder-[#3f3f46] focus:outline-none focus:border-[#52525b]"
			/>
		</div>
	</div>

	<button
		onclick={execute}
		disabled={processing || !selectedListing || !revenueAmount}
		class="px-6 py-2 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] tracking-[0.15em] hover:bg-amber-500/25 transition-colors disabled:opacity-40"
	>
		{processing ? 'PROCESSING...' : 'EXECUTE DISTRIBUTION'}
	</button>
</div>

<!-- Recent Distributions -->
<div class="border border-[#27272a] overflow-hidden">
	<div class="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-px bg-[#1a1a1a] border-b border-[#27272a]">
		{#each ['DATE', 'LISTING', 'TOTAL', 'PER UNIT', 'RECIPIENTS', 'STATUS'] as col}
			<div class="bg-[#0f0f10] px-4 py-2.5 text-[9px] tracking-[0.2em] text-[#3f3f46]">{col}</div>
		{/each}
	</div>

	{#if data.recent.length === 0}
		<div class="bg-[#09090b] p-12 text-center text-[10px] tracking-[0.2em] text-[#3f3f46]">
			NO DISTRIBUTIONS YET
		</div>
	{:else}
		{#each data.recent as dist}
			<div class="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-px bg-[#1a1a1a] border-b border-[#0f0f10] last:border-b-0">
				<div class="bg-[#09090b] px-4 py-3 text-[10px] text-[#3f3f46] w-28">
					{new Date(dist.created_at).toLocaleDateString('zh-TW')}
				</div>
				<div class="bg-[#09090b] px-4 py-3">
					<span class="text-[12px] text-[#a1a1aa] font-mono">{dist.listing_symbol}</span>
					<span class="text-[10px] text-[#52525b] ml-2">{dist.listing_name_zh}</span>
				</div>
				<div class="bg-[#09090b] px-4 py-3 text-[12px] text-[#d4d4d8] font-mono text-right w-36">
					NT$ {parseFloat(dist.total_amount).toLocaleString()}
				</div>
				<div class="bg-[#09090b] px-4 py-3 text-[11px] text-[#71717a] font-mono text-right w-28">
					{parseFloat(dist.amount_per_unit).toFixed(4)}
				</div>
				<div class="bg-[#09090b] px-4 py-3 text-[11px] text-[#52525b] text-center w-24">
					{dist.recipient_count}
				</div>
				<div class="bg-[#09090b] px-4 py-3 flex items-center justify-center w-24">
					<span class="text-[10px] tracking-wider {dist.status === 'paid' ? 'text-emerald-500' : 'text-amber-400'}">
						{dist.status.toUpperCase()}
					</span>
				</div>
			</div>
		{/each}
	{/if}
</div>
