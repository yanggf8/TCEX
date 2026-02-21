<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	let { data } = $props();

	let reviewing = $state<string | null>(null);
	let notes = $state('');
	let error = $state('');
	let expanded = $state<string | null>(null);

	const tabs = [
		{ value: 'pending', label: 'PENDING' },
		{ value: 'approved', label: 'APPROVED' },
		{ value: 'rejected', label: 'REJECTED' }
	];

	async function review(id: string, action: 'approve' | 'reject') {
		if (action === 'reject' && !notes.trim()) {
			error = 'REJECTION_REASON_REQUIRED';
			return;
		}
		reviewing = id;
		error = '';
		try {
			const res = await fetch(`/api/v1/admin/kyc/${id}/review`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action, notes: notes.trim() || null })
			});
			if (!res.ok) {
				const d = await res.json() as any;
				error = d.error?.code || 'OPERATION_FAILED';
				return;
			}
			notes = '';
			expanded = null;
			await invalidateAll();
		} catch {
			error = 'NETWORK_ERROR';
		} finally {
			reviewing = null;
		}
	}
</script>

<svelte:head><title>KYC Review · TCEX Admin</title></svelte:head>

<!-- Header -->
<div class="flex items-baseline justify-between mb-6">
	<div>
		<div class="text-[10px] text-[#52525b] tracking-[0.2em] mb-1">IDENTITY VERIFICATION</div>
		<h1 class="text-2xl font-light tracking-tight">KYC Review</h1>
	</div>
	<div class="text-[11px] text-[#52525b]">{data.applications.length} RECORDS</div>
</div>

<!-- Tabs -->
<div class="flex gap-px mb-6 border border-[#27272a] w-fit">
	{#each tabs as tab}
		<a
			href="/admin/kyc?status={tab.value}"
			class="px-5 py-2 text-[10px] tracking-[0.15em] transition-colors
				{data.status === tab.value
					? tab.value === 'pending' ? 'bg-amber-500/15 text-amber-400 border-r border-[#27272a]'
					: tab.value === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-r border-[#27272a]'
					: 'bg-red-500/10 text-red-400 border-r border-[#27272a]'
					: 'bg-[#09090b] text-[#52525b] hover:text-[#a1a1aa] border-r border-[#27272a] last:border-r-0'}"
		>
			{tab.label}
		</a>
	{/each}
</div>

{#if error}
	<div class="mb-4 px-4 py-2 border border-red-500/30 bg-red-500/5 text-[11px] text-red-400 tracking-wider">
		ERR: {error}
	</div>
{/if}

{#if data.applications.length === 0}
	<div class="border border-[#27272a] bg-[#09090b] p-16 text-center">
		<div class="text-[10px] tracking-[0.2em] text-[#3f3f46]">NO RECORDS FOUND</div>
		<div class="text-[11px] text-[#27272a] mt-2">Queue is clear for status: {data.status.toUpperCase()}</div>
	</div>
{:else}
	<div class="space-y-px border border-[#27272a]">
		{#each data.applications as app}
			{@const isExpanded = expanded === app.id}
			<div class="bg-[#09090b] border-b border-[#1a1a1a] last:border-b-0">
				<!-- Row -->
				<button
					onclick={() => expanded = isExpanded ? null : app.id}
					class="w-full flex items-center gap-4 px-5 py-4 hover:bg-[#0f0f10] transition-colors text-left group"
				>
					<!-- Status indicator -->
					<div class="w-1.5 h-1.5 rounded-full shrink-0
						{app.status === 'pending' ? 'bg-amber-400 animate-pulse' : app.status === 'approved' ? 'bg-emerald-400' : 'bg-red-400'}">
					</div>

					<!-- Level badge -->
					<div class="w-16 shrink-0">
						<span class="text-[10px] tracking-wider border px-2 py-0.5
							{app.level === 2 ? 'border-blue-500/30 text-blue-400' : 'border-[#27272a] text-[#52525b]'}">
							L{app.level}
						</span>
					</div>

					<!-- Email -->
					<div class="flex-1 min-w-0">
						<div class="text-[13px] text-[#d4d4d8] truncate">{app.email}</div>
						<div class="text-[10px] text-[#52525b] mt-0.5">{app.full_name || 'no name provided'}</div>
					</div>

					<!-- Docs -->
					<div class="text-[10px] text-[#3f3f46] w-20 text-right shrink-0">
						{app.document_count} DOC{app.document_count !== 1 ? 'S' : ''}
					</div>

					<!-- Date -->
					<div class="text-[10px] text-[#3f3f46] w-32 text-right shrink-0 hidden md:block">
						{new Date(app.created_at).toLocaleDateString('zh-TW')}
					</div>

					<!-- Expand indicator -->
					<div class="text-[#27272a] group-hover:text-[#52525b] transition-colors text-xs w-4 shrink-0">
						{isExpanded ? '▲' : '▼'}
					</div>
				</button>

				<!-- Expanded Details -->
				{#if isExpanded}
					<div class="px-5 pb-5 border-t border-[#1a1a1a]">
						<!-- Info Grid -->
						<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 mb-5">
							{#each [
								{ label: 'FULL NAME', value: app.full_name },
								{ label: 'DATE OF BIRTH', value: app.date_of_birth },
								{ label: 'NATIONAL ID', value: app.national_id },
								{ label: 'PHONE', value: app.phone },
							] as field}
								<div>
									<div class="text-[9px] tracking-[0.2em] text-[#3f3f46] mb-1">{field.label}</div>
									<div class="text-[12px] text-[#a1a1aa]">{field.value || '—'}</div>
								</div>
							{/each}
							<div class="col-span-2 md:col-span-4">
								<div class="text-[9px] tracking-[0.2em] text-[#3f3f46] mb-1">ADDRESS</div>
								<div class="text-[12px] text-[#a1a1aa]">{app.address || '—'}</div>
							</div>
						</div>

						{#if app.reviewer_notes}
							<div class="border border-[#27272a] bg-[#0f0f10] px-4 py-3 mb-4">
								<div class="text-[9px] tracking-[0.2em] text-[#3f3f46] mb-1">REVIEWER NOTES</div>
								<div class="text-[12px] text-[#71717a]">{app.reviewer_notes}</div>
							</div>
						{/if}

						{#if data.status === 'pending'}
							<div class="flex gap-3 items-end mt-4">
								<div class="flex-1">
									<div class="text-[9px] tracking-[0.2em] text-[#3f3f46] mb-1.5">NOTES (required for rejection)</div>
									<textarea
										rows="2"
										bind:value={notes}
										placeholder="Enter reviewer notes..."
										class="w-full bg-[#0f0f10] border border-[#27272a] px-3 py-2 text-[12px] text-[#a1a1aa] placeholder-[#3f3f46] focus:outline-none focus:border-[#52525b] resize-none"
									></textarea>
								</div>
								<div class="flex gap-2 shrink-0">
									<button
										onclick={() => review(app.id, 'approve')}
										disabled={reviewing === app.id}
										class="px-5 py-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] tracking-[0.1em] hover:bg-emerald-500/25 transition-colors disabled:opacity-40"
									>
										APPROVE
									</button>
									<button
										onclick={() => review(app.id, 'reject')}
										disabled={reviewing === app.id}
										class="px-5 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] tracking-[0.1em] hover:bg-red-500/20 transition-colors disabled:opacity-40"
									>
										REJECT
									</button>
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	</div>
{/if}
