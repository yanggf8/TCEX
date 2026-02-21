<script lang="ts">
	import { invalidateAll, goto } from '$app/navigation';
	let { data } = $props();

	let search = $state(data.search);
	let processing = $state<string | null>(null);
	let error = $state('');

	// Mock deposit
	let depositFor = $state<{ id: string; email: string } | null>(null);
	let depositAmount = $state('');
	let depositNote = $state('');
	let depositLoading = $state(false);
	let depositError = $state('');

	function handleSearch(e: Event) {
		e.preventDefault();
		goto(`/admin/users?q=${encodeURIComponent(search)}`);
	}

	async function toggleStatus(userId: string, currentStatus: string) {
		const action = currentStatus === 'active' ? 'freeze' : 'unfreeze';
		processing = userId;
		error = '';
		try {
			const res = await fetch(`/api/v1/admin/users/${userId}/status`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action })
			});
			if (!res.ok) {
				const d = await res.json() as any;
				error = d.error?.code || 'OPERATION_FAILED';
				return;
			}
			await invalidateAll();
		} catch {
			error = 'NETWORK_ERROR';
		} finally {
			processing = null;
		}
	}

	async function submitDeposit() {
		if (!depositFor) return;
		const amt = parseFloat(depositAmount);
		if (isNaN(amt) || amt <= 0) { depositError = 'INVALID_AMOUNT'; return; }
		depositLoading = true;
		depositError = '';
		try {
			const res = await fetch(`/api/v1/admin/users/${depositFor.id}/deposit`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ amount: depositAmount, note: depositNote || undefined })
			});
			if (!res.ok) {
				const d = await res.json() as any;
				depositError = d.error || 'DEPOSIT_FAILED';
				return;
			}
			depositFor = null;
			depositAmount = '';
			depositNote = '';
			await invalidateAll();
		} catch {
			depositError = 'NETWORK_ERROR';
		} finally {
			depositLoading = false;
		}
	}
</script>

<svelte:head><title>Users · TCEX Admin</title></svelte:head>

<!-- Header -->
<div class="flex items-baseline justify-between mb-6">
	<div>
		<div class="text-[10px] text-[#52525b] tracking-[0.2em] mb-1">ACCOUNT REGISTRY</div>
		<h1 class="text-2xl font-light tracking-tight">
			Users
			<span class="text-[#3f3f46] text-lg font-light ml-2">{data.total.toLocaleString()}</span>
		</h1>
	</div>

	<!-- Search -->
	<form onsubmit={handleSearch} class="flex border border-[#27272a]">
		<input
			type="text"
			bind:value={search}
			placeholder="search email or name..."
			class="bg-[#09090b] px-4 py-2 text-[12px] text-[#a1a1aa] placeholder-[#3f3f46] focus:outline-none w-56 border-r border-[#27272a]"
		/>
		<button type="submit" class="px-4 py-2 text-[10px] tracking-[0.1em] text-[#52525b] hover:text-[#a1a1aa] hover:bg-[#0f0f10] transition-colors">
			SEARCH
		</button>
	</form>
</div>

{#if error}
	<div class="mb-4 px-4 py-2 border border-red-500/30 bg-red-500/5 text-[11px] text-red-400 tracking-wider">
		ERR: {error}
	</div>
{/if}

<!-- Table -->
<div class="border border-[#27272a] overflow-hidden">
	<!-- Table Header -->
	<div class="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-px bg-[#1a1a1a] border-b border-[#27272a]">
		{#each ['EMAIL / NAME', 'KYC', 'VERIFIED', 'STATUS', 'JOINED', ''] as col, i}
			<div class="bg-[#0f0f10] px-4 py-2.5 text-[9px] tracking-[0.2em] text-[#3f3f46] {i === 0 ? '' : 'text-center'} {i === 5 ? 'w-36' : ''}">
				{col}
			</div>
		{/each}
	</div>

	<!-- Rows -->
	{#each data.users as user}
		<div class="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-px bg-[#1a1a1a] border-b border-[#0f0f10] last:border-b-0 hover:bg-[#27272a] transition-colors group">
			<!-- Email + Name -->
			<div class="bg-[#09090b] group-hover:bg-[#0f0f10] px-4 py-3 transition-colors">
				<div class="text-[12px] text-[#d4d4d8]">{user.email}</div>
				<div class="text-[10px] text-[#52525b] mt-0.5">{user.display_name || '—'}</div>
			</div>

			<!-- KYC Level -->
			<div class="bg-[#09090b] group-hover:bg-[#0f0f10] px-4 py-3 flex items-center justify-center transition-colors w-20">
				<span class="text-[10px] tracking-wider border px-2 py-0.5
					{user.kyc_level >= 2 ? 'border-blue-500/30 text-blue-400'
					: user.kyc_level === 1 ? 'border-emerald-500/20 text-emerald-500'
					: 'border-[#27272a] text-[#52525b]'}">
					L{user.kyc_level}
				</span>
			</div>

			<!-- Verification -->
			<div class="bg-[#09090b] group-hover:bg-[#0f0f10] px-4 py-3 flex items-center justify-center gap-2 transition-colors w-28">
				<span class="text-[10px] {user.email_verified ? 'text-emerald-500' : 'text-[#27272a]'}" title="Email">E</span>
				<span class="text-[#27272a]">·</span>
				<span class="text-[10px] {user.phone_verified ? 'text-emerald-500' : 'text-[#27272a]'}" title="Phone">P</span>
			</div>

			<!-- Status -->
			<div class="bg-[#09090b] group-hover:bg-[#0f0f10] px-4 py-3 flex items-center justify-center transition-colors w-28">
				<div class="flex items-center gap-1.5">
					<div class="w-1.5 h-1.5 rounded-full {user.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'}"></div>
					<span class="text-[10px] tracking-wider {user.status === 'active' ? 'text-emerald-500' : 'text-red-400'}">
						{user.status.toUpperCase()}
					</span>
				</div>
			</div>

			<!-- Joined -->
			<div class="bg-[#09090b] group-hover:bg-[#0f0f10] px-4 py-3 flex items-center justify-center transition-colors w-28">
				<span class="text-[10px] text-[#3f3f46]">{new Date(user.created_at).toLocaleDateString('zh-TW')}</span>
			</div>

			<!-- Action -->
			<div class="bg-[#09090b] group-hover:bg-[#0f0f10] px-4 py-3 flex items-center justify-center gap-3 transition-colors w-36">
				{#if user.role !== 'admin'}
					<button
						onclick={() => toggleStatus(user.id, user.status)}
						disabled={processing === user.id}
						class="text-[10px] tracking-[0.1em] transition-colors disabled:opacity-30
							{user.status === 'active'
								? 'text-[#52525b] hover:text-red-400'
								: 'text-[#52525b] hover:text-emerald-400'}"
					>
						{user.status === 'active' ? 'FREEZE' : 'UNFREEZE'}
					</button>
					<span class="text-[#27272a]">|</span>
					<button
						onclick={() => { depositFor = { id: user.id, email: user.email }; depositAmount = ''; depositNote = ''; depositError = ''; }}
						class="text-[10px] tracking-[0.1em] text-[#52525b] hover:text-amber-400 transition-colors"
					>
						DEPOSIT
					</button>
				{:else}
					<span class="text-[10px] text-[#27272a]">ADMIN</span>
				{/if}
			</div>
		</div>
	{/each}
</div>

<!-- Mock Deposit Modal -->
{#if depositFor}
	<div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onclick={() => depositFor = null}>
		<div class="border border-[#27272a] bg-[#09090b] p-6 w-full max-w-sm" onclick={(e) => e.stopPropagation()}>
			<div class="text-[9px] tracking-[0.2em] text-[#52525b] mb-1">MOCK DEPOSIT</div>
			<div class="text-[13px] text-[#d4d4d8] mb-4">{depositFor.email}</div>

			{#if depositError}
				<div class="mb-3 px-3 py-2 border border-red-500/30 bg-red-500/5 text-[11px] text-red-400">ERR: {depositError}</div>
			{/if}

			<div class="mb-3">
				<div class="text-[9px] tracking-[0.15em] text-[#3f3f46] mb-1">AMOUNT (TWD)</div>
				<input
					bind:value={depositAmount}
					type="number"
					placeholder="50000"
					class="w-full bg-[#0f0f10] border border-[#27272a] px-3 py-2 text-[13px] text-[#a1a1aa] placeholder-[#3f3f46] focus:outline-none focus:border-[#52525b]"
				/>
			</div>
			<div class="mb-4">
				<div class="text-[9px] tracking-[0.15em] text-[#3f3f46] mb-1">NOTE (optional)</div>
				<input
					bind:value={depositNote}
					placeholder="管理員模擬入帳"
					class="w-full bg-[#0f0f10] border border-[#27272a] px-3 py-2 text-[12px] text-[#a1a1aa] placeholder-[#3f3f46] focus:outline-none focus:border-[#52525b]"
				/>
			</div>
			<div class="flex gap-3">
				<button
					onclick={submitDeposit}
					disabled={depositLoading}
					class="flex-1 py-2 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] tracking-[0.15em] hover:bg-amber-500/25 transition-colors disabled:opacity-40"
				>
					{depositLoading ? 'PROCESSING...' : 'CONFIRM DEPOSIT'}
				</button>
				<button
					onclick={() => depositFor = null}
					class="px-4 py-2 border border-[#27272a] text-[10px] tracking-[0.1em] text-[#52525b] hover:text-[#a1a1aa] transition-colors"
				>
					CANCEL
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Pagination -->
{#if data.pages > 1}
	<div class="flex items-center justify-between mt-4">
		<div class="text-[10px] text-[#3f3f46]">
			PAGE {data.page} OF {data.pages}
		</div>
		<div class="flex gap-px border border-[#27272a]">
			{#each Array.from({ length: data.pages }, (_, i) => i + 1) as p}
				<a
					href="/admin/users?q={data.search}&page={p}"
					class="px-4 py-2 text-[10px] tracking-wider transition-colors border-r border-[#1a1a1a] last:border-r-0
						{p === data.page
							? 'bg-amber-500/15 text-amber-400'
							: 'bg-[#09090b] text-[#52525b] hover:text-[#a1a1aa] hover:bg-[#0f0f10]'}"
				>{p}</a>
			{/each}
		</div>
	</div>
{/if}
