<script lang="ts">
	import { t } from '$lib/i18n';
	import { goto } from '$app/navigation';

	let displayName = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let loading = $state(false);

	let passwordMismatch = $derived(confirmPassword.length > 0 && password !== confirmPassword);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';

		if (password !== confirmPassword) {
			error = $t('register.passwordMismatch');
			return;
		}

		loading = true;

		try {
			const res = await fetch('/api/v1/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email,
					password,
					displayName: displayName || undefined
				})
			});

			const data = await res.json();

			if (!res.ok) {
				error = data.error?.message || '註冊失敗';
				return;
			}

			// Store access token
			sessionStorage.setItem('accessToken', data.accessToken);

			// Redirect to homepage after registration
			goto('/');
		} catch {
			error = '網路錯誤，請稍後再試';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{$t('register.title')} | TCEX</title>
	<meta name="description" content={$t('register.subtitle')} />
</svelte:head>

<div class="min-h-[60vh] flex items-center justify-center px-4 py-12">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<h1 class="text-2xl font-bold text-gray-900">{$t('register.title')}</h1>
			<p class="text-gray-600 mt-2">{$t('register.subtitle')}</p>
		</div>

		<div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
			{#if error}
				<div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
					<p class="text-red-700 text-sm">{error}</p>
				</div>
			{/if}

			<form onsubmit={handleSubmit} class="space-y-5">
				<div>
					<label for="displayName" class="block text-sm font-medium text-gray-700 mb-1">
						{$t('register.displayName')}
					</label>
					<input
						id="displayName"
						type="text"
						bind:value={displayName}
						placeholder={$t('register.displayNamePlaceholder')}
						autocomplete="name"
						class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
					/>
				</div>

				<div>
					<label for="email" class="block text-sm font-medium text-gray-700 mb-1">
						{$t('register.email')}
					</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						placeholder={$t('register.emailPlaceholder')}
						required
						autocomplete="email"
						class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700 mb-1">
						{$t('register.password')}
					</label>
					<input
						id="password"
						type="password"
						bind:value={password}
						placeholder={$t('register.passwordPlaceholder')}
						required
						minlength="12"
						autocomplete="new-password"
						class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
					/>
				</div>

				<div>
					<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
						{$t('register.confirmPassword')}
					</label>
					<input
						id="confirmPassword"
						type="password"
						bind:value={confirmPassword}
						placeholder={$t('register.confirmPasswordPlaceholder')}
						required
						minlength="12"
						autocomplete="new-password"
						class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
						class:border-red-300={passwordMismatch}
					/>
					{#if passwordMismatch}
						<p class="text-red-600 text-xs mt-1">{$t('register.passwordMismatch')}</p>
					{/if}
				</div>

				<div class="text-xs text-gray-500">
					{$t('register.terms')}
					<a href="/resources/rules" class="text-primary-600 hover:underline">{$t('register.termsLink')}</a>
					{$t('register.and')}
					<a href="/resources/rules" class="text-primary-600 hover:underline">{$t('register.privacyLink')}</a>
					{$t('register.riskDisclosure')}
				</div>

				<button
					type="submit"
					disabled={loading || passwordMismatch}
					class="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white text-sm font-medium rounded-lg transition-colors"
				>
					{loading ? $t('register.submitting') : $t('register.submit')}
				</button>
			</form>
		</div>

		<p class="text-center text-sm text-gray-500 mt-6">
			{$t('register.hasAccount')}
			<a href="/login" class="text-primary-600 hover:text-primary-700 font-medium ml-1">
				{$t('register.login')}
			</a>
		</p>
	</div>
</div>
