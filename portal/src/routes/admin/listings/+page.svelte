<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	let { data } = $props();

	let showForm = $state(false);
	let submitting = $state(false);
	let error = $state('');

	// New listing form
	let form = $state({
		productId: '', symbol: '', nameZh: '', nameEn: '',
		unitPrice: '', totalUnits: '', yieldRate: '', riskLevel: 'medium'
	});

	const statusColors: Record<string, string> = {
		active: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
		suspended: 'text-amber-400 border-amber-500/30 bg-amber-500/15',
		closed: 'text-[#52525b] border-[#27272a] bg-[#0f0f10]'
	};

	async function toggleStatus(id: string, current: string) {
		const next = current === 'active' ? 'suspended' : 'active';
		const res = await fetch(`/api/v1/admin/listings/${id}/status`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: next })
		});
		if (res.ok) await invalidateAll();
	}

	async function createListing() {
		if (!form.productId || !form.symbol || !form.nameZh || !form.nameEn || !form.unitPrice || !form.totalUnits) {
			error = 'MISSING_REQUIRED_FIELDS';
			return;
		}
		submitting = true;
		error = '';
		try {
			const res = await fetch('/api/v1/admin/listings', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form)
			});
			if (!res.ok) {
				const d = await res.json() as any;
				error = d.error || 'CREATE_FAILED';
				return;
			}
			form = { productId: '', symbol: '', nameZh: '', nameEn: '', unitPrice: '', totalUnits: '', yieldRate: '', riskLevel: 'medium' };
			showForm = false;
			await invalidateAll();
		} catch {
			error = 'NETWORK_ERROR';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head><title>Listings · TCEX Admin</title></svelte:head>

<!-- Header -->
<div class="flex items-baseline justify-between mb-6">
	<div>
		<div class="text-[10px] text-[#52525b] tracking-[0.2em] mb-1">MARKET MANAGEMENT</div>
		<h1 class="text-2xl font-light tracking-tight">Listings</h1>
	</div>
	<button
		onclick={() => { showForm = !showForm; error = ''; }}
		class="px-4 py-2 text-[10px] tracking-[0.15em] border transition-colors
			{showForm ? 'border-[#52525b] text-[#52525b]' : 'border-amber-500/40 text-amber-400 hover:bg-amber-500/10'}"
	>
		{showForm ? 'CANCEL' : '+ NEW LISTING'}
	</button>
</div>

{#if error}
	<div class="mb-4 px-4 py-2 border border-red-500/30 bg-red-500/5 text-[11px] text-red-400 tracking-wider">
		ERR: {error}
	</div>
{/if}

<!-- New Listing Form -->
{#if showForm}
	<div class="border border-[#27272a] bg-[#09090b] p-5 mb-6">
		<div class="text-[9px] tracking-[0.2em] text-[#52525b] mb-4">NEW LISTING</div>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
			<div>
				<div class="text-[9px] tracking-[0.15em] text-[#3f3f46] mb-1">PRODUCT *</div>
				<select
					bind:value={form.productId}
					class="w-full bg-[#0f0f10] border border-[#27272a] px-3 py-2 text-[12px] text-[#a1a1aa] focus:outline-none focus:border-[#52525b]"
				>
					<option value="">Select product...</option>
					{#each data.products as p}
						<option value={p.id}>[{p.product_type.toUpperCase()}] {p.name_zh}</option>
					{/each}
				</select>
			</div>
			<div>
				<div class="text-[9px] tracking-[0.15em] text-[#3f3f46] mb-1">SYMBOL *</div>
				<input bind:value={form.symbol} placeholder="e.g. RBO-001" class="w-full bg-[#0f0f10] border border-[#27272a] px-3 py-2 text-[12px] text-[#a1a1aa] placeholder-[#3f3f46] focus:outline-none focus:border-[#52525b]" />
			</div>
			<div>
				<div class="text-[9px] tracking-[0.15em] text-[#3f3f46] mb-1">NAME (ZH) *</div>
				<input bind:value={form.nameZh} placeholder="中文名稱" class="w-full bg-[#0f0f10] border border-[#27272a] px-3 py-2 text-[12px] text-[#a1a1aa] placeholder-[#3f3f46] focus:outline-none focus:border-[#52525b]" />
			</div>
			<div>
				<div class="text-[9px] tracking-[0.15em] text-[#3f3f46] mb-1">NAME (EN) *</div>
				<input bind:value={form.nameEn} placeholder="English Name" class="w-full bg-[#0f0f10] border border-[#27272a] px-3 py-2 text-[12px] text-[#a1a1aa] placeholder-[#3f3f46] focus:outline-none focus:border-[#52525b]" />
			</div>
			<div>
				<div class="text-[9px] tracking-[0.15em] text-[#3f3f46] mb-1">UNIT PRICE (TWD) *</div>
				<input bind:value={form.unitPrice} type="number" placeholder="100" class="w-full bg-[#0f0f10] border border-[#27272a] px-3 py-2 text-[12px] text-[#a1a1aa] placeholder-[#3f3f46] focus:outline-none focus:border-[#52525b]" />
			</div>
			<div>
				<div class="text-[9px] tracking-[0.15em] text-[#3f3f46] mb-1">TOTAL UNITS *</div>
				<input bind:value={form.totalUnits} type="number" placeholder="10000" class="w-full bg-[#0f0f10] border border-[#27272a] px-3 py-2 text-[12px] text-[#a1a1aa] placeholder-[#3f3f46] focus:outline-none focus:border-[#52525b]" />
			</div>
			<div>
				<div class="text-[9px] tracking-[0.15em] text-[#3f3f46] mb-1">YIELD RATE</div>
				<input bind:value={form.yieldRate} type="number" step="0.001" placeholder="0.08" class="w-full bg-[#0f0f10] border border-[#27272a] px-3 py-2 text-[12px] text-[#a1a1aa] placeholder-[#3f3f46] focus:outline-none focus:border-[#52525b]" />
			</div>
			<div>
				<div class="text-[9px] tracking-[0.15em] text-[#3f3f46] mb-1">RISK LEVEL</div>
				<select bind:value={form.riskLevel} class="w-full bg-[#0f0f10] border border-[#27272a] px-3 py-2 text-[12px] text-[#a1a1aa] focus:outline-none focus:border-[#52525b]">
					<option value="low">LOW</option>
					<option value="medium">MEDIUM</option>
					<option value="high">HIGH</option>
				</select>
			</div>
		</div>
		<button
			onclick={createListing}
			disabled={submitting}
			class="px-6 py-2 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] tracking-[0.15em] hover:bg-amber-500/25 transition-colors disabled:opacity-40"
		>
			{submitting ? 'CREATING...' : 'CREATE LISTING'}
		</button>
	</div>
{/if}

<!-- Listings Table -->
{#if data.listings.length === 0}
	<div class="border border-[#27272a] bg-[#09090b] p-16 text-center">
		<div class="text-[10px] tracking-[0.2em] text-[#3f3f46]">NO LISTINGS FOUND</div>
	</div>
{:else}
	<div class="border border-[#27272a]">
		<!-- Table Header -->
		<div class="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] gap-4 px-5 py-2 border-b border-[#27272a] bg-[#0f0f10]">
			{#each ['SYMBOL / NAME', 'TYPE', 'UNIT PRICE', 'UNITS', 'YIELD', 'STATUS'] as h}
				<div class="text-[9px] tracking-[0.2em] text-[#3f3f46]">{h}</div>
			{/each}
		</div>

		{#each data.listings as listing}
			<div class="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] gap-4 px-5 py-3 border-b border-[#1a1a1a] last:border-b-0 hover:bg-[#0f0f10] transition-colors items-center">
				<div>
					<div class="text-[12px] text-[#d4d4d8]">{listing.symbol}</div>
					<div class="text-[10px] text-[#52525b] mt-0.5">{listing.name_zh}</div>
				</div>
				<div class="text-[10px] text-[#71717a] tracking-wider">{listing.product_type.toUpperCase()}</div>
				<div class="text-[12px] text-[#a1a1aa]">NT$ {parseFloat(listing.unit_price).toLocaleString()}</div>
				<div>
					<div class="text-[11px] text-[#a1a1aa]">{parseInt(listing.available_units).toLocaleString()}</div>
					<div class="text-[9px] text-[#3f3f46]">/ {parseInt(listing.total_units).toLocaleString()}</div>
				</div>
				<div class="text-[11px] text-[#a1a1aa]">
					{listing.yield_rate ? (parseFloat(listing.yield_rate) * 100).toFixed(1) + '%' : '—'}
				</div>
				<div class="flex items-center gap-2">
					<span class="text-[9px] tracking-wider border px-2 py-0.5 {statusColors[listing.status] ?? statusColors.closed}">
						{listing.status.toUpperCase()}
					</span>
					{#if listing.status !== 'closed'}
						<button
							onclick={() => toggleStatus(listing.id, listing.status)}
							class="text-[9px] text-[#3f3f46] hover:text-[#a1a1aa] transition-colors"
							title={listing.status === 'active' ? 'Suspend' : 'Activate'}
						>
							{listing.status === 'active' ? '⏸' : '▶'}
						</button>
					{/if}
				</div>
			</div>
		{/each}
	</div>
{/if}
