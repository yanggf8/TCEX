<script lang="ts">
	import { t } from '$lib/i18n';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	// 2FA state — triggered by email/password login or LINE OAuth redirect
	let requires2fa = $state(page.url.searchParams.get('requires2fa') === 'true');
	let totpCode = $state('');
	let twoFaLoading = $state(false);

	// Check for LINE error
	const lineError = page.url.searchParams.get('error');
	if (lineError) {
		error = lineError === 'line_denied' ? 'LINE 登入已取消' : `LINE 登入失敗: ${lineError}`;
	}

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

			// Check if 2FA is required (login2faToken set as httpOnly cookie by server)
			if (data.requires2fa) {
				requires2fa = true;
				return;
			}

			// Success — accessToken is set as httpOnly cookie by server, just redirect
			const redirect = page.url.searchParams.get('redirect') || '/dashboard';
			goto(redirect);
		} catch {
			error = '網路錯誤，請稍後再試';
		} finally {
			loading = false;
		}
	}

	async function handle2faSubmit(e: Event) {
		e.preventDefault();
		error = '';
		twoFaLoading = true;

		try {
			const res = await fetch('/api/v1/auth/login-2fa', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ totpCode })
			});

			const data: any = await res.json();

			if (!res.ok) {
				error = data.error?.message || '驗證失敗';
				return;
			}

			// Success — accessToken is set as httpOnly cookie by server, just redirect
			const redirect = page.url.searchParams.get('redirect') || '/dashboard';
			goto(redirect);
		} catch {
			error = '網路錯誤，請稍後再試';
		} finally {
			twoFaLoading = false;
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

			{#if requires2fa}
				<!-- 2FA Step -->
				<form onsubmit={handle2faSubmit} class="space-y-5">
					<div class="text-center mb-4">
						<p class="text-sm text-gray-600">{$t('twofa.loginPrompt')}</p>
					</div>
					<div>
						<label for="totpCode" class="block text-sm font-medium text-gray-700 mb-1">
							{$t('twofa.code')}
						</label>
						<input
							id="totpCode"
							type="text"
							bind:value={totpCode}
							maxlength="8"
							placeholder={$t('twofa.enterCode')}
							required
							autocomplete="one-time-code"
							class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-center tracking-widest"
						/>
						<p class="mt-1 text-xs text-gray-400">{$t('twofa.orBackupCode')}</p>
					</div>

					<button
						type="submit"
						disabled={twoFaLoading || !totpCode}
						class="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white text-sm font-medium rounded-lg transition-colors"
					>
						{twoFaLoading ? $t('common.loading') : $t('twofa.verifyLogin')}
					</button>

					<button
						type="button"
						onclick={() => { requires2fa = false; totpCode = ''; error = ''; }}
						class="w-full py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
					>
						{$t('common.back')}
					</button>
				</form>
			{:else}
				<!-- Login Form -->
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

				<!-- Social Login -->
				<div class="mt-6 pt-6 border-t border-gray-200 space-y-3">
					<a
						href="/api/v1/auth/google"
						class="flex items-center justify-center gap-2 w-full py-2.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors"
					>
						<svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
						{$t('google.loginWith')}
					</a>
					<a
						href="/api/v1/auth/line"
						class="flex items-center justify-center gap-2 w-full py-2.5 bg-[#06C755] hover:bg-[#05b34d] text-white text-sm font-medium rounded-lg transition-colors"
					>
						{$t('line.loginWith')}
					</a>
				</div>
			{/if}
		</div>

		<p class="text-center text-sm text-gray-500 mt-6">
			{$t('login.noAccount')}
			<a href="/register" class="text-primary-600 hover:text-primary-700 font-medium ml-1">
				{$t('login.register')}
			</a>
		</p>
	</div>
</div>
