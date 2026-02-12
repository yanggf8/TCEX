<script lang="ts">
	import { t } from '$lib/i18n';

	let email = $state('');
	let submitted = $state(false);

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (email) {
			submitted = true;
		}
	}
</script>

<svelte:head>
	<title>{$t('login.title')} | TCEX</title>
	<meta name="description" content={$t('login.subtitle')} />
</svelte:head>

<div class="min-h-[60vh] flex items-center justify-center px-4">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<h1 class="text-2xl font-bold text-gray-900">{$t('login.title')}</h1>
			<p class="text-gray-600 mt-2">{$t('login.subtitle')}</p>
		</div>

		<div class="bg-primary-50 border border-primary-200 rounded-lg p-8 text-center">
			<div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
				<svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
				</svg>
			</div>
			<h2 class="text-lg font-semibold text-gray-900 mb-2">{$t('login.comingSoon')}</h2>
			<p class="text-gray-600 text-sm mb-6">{$t('login.notice')}</p>

			{#if submitted}
				<div class="bg-green-50 border border-green-200 rounded-lg p-4">
					<p class="text-green-700 text-sm">{$t('login.notifySuccess')}</p>
				</div>
			{:else}
				<div class="text-left">
					<p class="text-sm text-gray-500 mb-3">{$t('login.notify')}</p>
					<form class="flex gap-2" onsubmit={handleSubmit}>
						<input
							type="email"
							bind:value={email}
							placeholder={$t('login.emailPlaceholder')}
							required
							class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
						/>
						<button
							type="submit"
							class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
						>
							{$t('login.notifyBtn')}
						</button>
					</form>
				</div>
			{/if}
		</div>
	</div>
</div>
