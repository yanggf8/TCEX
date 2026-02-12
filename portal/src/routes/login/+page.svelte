<script lang="ts">
	import { t } from '$lib/i18n';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		loading = true;

		try {
			const res = await fetch('/api/v1/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});

			const data: any = await res.json();

			if (!res.ok) {
				error = data.error?.message || '登入失敗';
				return;
			}

			// Store access token in memory (not localStorage for security)
			sessionStorage.setItem('accessToken', data.accessToken);

			// Redirect to intended page or dashboard
			const redirect = page.url.searchParams.get('redirect') || '/';
			goto(redirect);
		} catch {
			error = '網路錯誤，請稍後再試';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{$t('login.title')} | TCEX</title>
	<meta name="description" content={$t('login.subtitle')} />
</svelte:head>

<div class="min-h-[60vh] flex items-center justify-center px-4 py-12">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<h1 class="text-2xl font-bold text-gray-900">{$t('login.title')}</h1>
			<p class="text-gray-600 mt-2">{$t('login.subtitle')}</p>
		</div>

		<div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
			{#if error}
				<div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
					<p class="text-red-700 text-sm">{error}</p>
				</div>
			{/if}

			<form onsubmit={handleSubmit} class="space-y-5">
				<div>
					<label for="email" class="block text-sm font-medium text-gray-700 mb-1">
						{$t('login.email')}
					</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						placeholder={$t('login.emailPlaceholder')}
						required
						autocomplete="email"
						class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700 mb-1">
						{$t('login.password')}
					</label>
					<input
						id="password"
						type="password"
						bind:value={password}
						placeholder={$t('login.passwordPlaceholder')}
						required
						autocomplete="current-password"
						class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
					/>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white text-sm font-medium rounded-lg transition-colors"
				>
					{loading ? $t('login.submitting') : $t('login.submit')}
				</button>
			</form>
		</div>

		<p class="text-center text-sm text-gray-500 mt-6">
			{$t('login.noAccount')}
			<a href="/register" class="text-primary-600 hover:text-primary-700 font-medium ml-1">
				{$t('login.register')}
			</a>
		</p>
	</div>
</div>
