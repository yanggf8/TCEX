<script lang="ts">
	import { t } from '$lib/i18n';

	let { data } = $props();

	const quickActions = [
		{ href: '/markets/products', key: 'dashboard.action.trade', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
		{ href: '/dashboard/wallet', key: 'dashboard.action.deposit', icon: 'M12 4v16m8-8H4' },
		{ href: '/markets/products', key: 'dashboard.action.browse', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' }
	];
</script>

<svelte:head>
	<title>{$t('dashboard.nav.overview')} | TCEX</title>
</svelte:head>

<div class="space-y-6 pb-20 lg:pb-0">
	<!-- Welcome -->
	<div>
		<h1 class="text-2xl font-bold text-gray-900">
			{$t('dashboard.welcome')}{#if data.user?.displayName}, {data.user.displayName}{/if}
		</h1>
		<p class="text-gray-500 mt-1">{$t('dashboard.welcomeSubtitle')}</p>
	</div>

	<!-- Stat Cards -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
		<div class="bg-white rounded-xl border border-gray-200 p-5">
			<p class="text-sm text-gray-500 mb-1">{$t('dashboard.stats.portfolioValue')}</p>
			<p class="text-xl font-bold text-gray-900">NT$ {data.stats.portfolioValue}</p>
		</div>
		<div class="bg-white rounded-xl border border-gray-200 p-5">
			<p class="text-sm text-gray-500 mb-1">{$t('dashboard.stats.availableBalance')}</p>
			<p class="text-xl font-bold text-gray-900">NT$ {data.stats.availableBalance}</p>
		</div>
		<div class="bg-white rounded-xl border border-gray-200 p-5">
			<p class="text-sm text-gray-500 mb-1">{$t('dashboard.stats.positions')}</p>
			<p class="text-xl font-bold text-gray-900">{data.stats.positionCount}</p>
		</div>
		<div class="bg-white rounded-xl border border-gray-200 p-5">
			<p class="text-sm text-gray-500 mb-1">{$t('dashboard.stats.watchlist')}</p>
			<p class="text-xl font-bold text-gray-900">{data.stats.watchlistCount}</p>
		</div>
	</div>

	<!-- Quick Actions -->
	<div>
		<h2 class="text-lg font-semibold text-gray-900 mb-3">{$t('dashboard.quickActions')}</h2>
		<div class="grid grid-cols-3 gap-4">
			{#each quickActions as action}
				<a
					href={action.href}
					class="bg-white rounded-xl border border-gray-200 p-4 text-center hover:shadow-md hover:border-primary-200 transition-all"
				>
					<div class="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-2">
						<svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={action.icon} />
						</svg>
					</div>
					<span class="text-sm font-medium text-gray-700">{$t(action.key)}</span>
				</a>
			{/each}
		</div>
	</div>

	<!-- Recent Activity -->
	<div>
		<h2 class="text-lg font-semibold text-gray-900 mb-3">{$t('dashboard.recentActivity')}</h2>
		{#if data.recentActivity.length === 0}
			<div class="bg-white rounded-xl border border-gray-200 p-8 text-center">
				<div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
					<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<p class="text-gray-500">{$t('common.noData')}</p>
			</div>
		{:else}
			<div class="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
				{#each data.recentActivity as act}
					{@const isCredit = ['deposit', 'distribution', 'trade_credit'].includes(act.type)}
					{@const typeLabel = act.type === 'deposit' ? '入金'
						: act.type === 'withdrawal' ? '出金'
						: act.type === 'distribution' ? '收入分成'
						: act.type === 'trade_debit' ? '買入'
						: act.type === 'trade_credit' ? '賣出'
						: act.type === 'lock' ? '委託鎖定'
						: act.type === 'unlock' ? '委託解鎖'
						: act.type}
					<div class="flex items-center justify-between px-4 py-3">
						<div class="flex items-center gap-3">
							<div class="w-8 h-8 rounded-full flex items-center justify-center {isCredit ? 'bg-green-50' : 'bg-red-50'}">
								<svg class="w-4 h-4 {isCredit ? 'text-green-500' : 'text-red-400'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={isCredit ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'} />
								</svg>
							</div>
							<div>
								<p class="text-sm font-medium text-gray-900">{typeLabel}</p>
								{#if act.description}
									<p class="text-xs text-gray-400">{act.description}</p>
								{/if}
							</div>
						</div>
						<div class="text-right">
							<p class="text-sm font-semibold {isCredit ? 'text-green-600' : 'text-gray-700'}">
								{isCredit ? '+' : '-'}NT$ {parseFloat(act.amount).toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
							</p>
							<p class="text-xs text-gray-400">{new Date(act.createdAt).toLocaleDateString('zh-TW')}</p>
						</div>
					</div>
				{/each}
				<div class="px-4 py-2 text-center">
					<a href="/dashboard/wallet" class="text-xs text-primary-600 hover:underline">{$t('dashboard.viewAll')}</a>
				</div>
			</div>
		{/if}
	</div>
</div>
