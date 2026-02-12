<script lang="ts">
	import { t } from '$lib/i18n';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	// Profile form
	let displayName = $state(data.profile.displayName || '');
	let phone = $state(data.profile.phone || '');
	let profileLoading = $state(false);
	let profileError = $state('');
	let profileSuccess = $state('');

	// Password form
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let passwordLoading = $state(false);
	let passwordError = $state('');
	let passwordSuccess = $state('');

	async function handleProfileUpdate() {
		profileError = '';
		profileSuccess = '';
		profileLoading = true;

		try {
			const res = await fetch('/api/v1/account/profile', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ displayName, phone })
			});
			const result = await res.json();

			if (!res.ok) {
				profileError = result.error?.message || $t('common.error');
				return;
			}

			profileSuccess = $t('settings.profileUpdated');
			await invalidateAll();
		} catch {
			profileError = $t('common.error');
		} finally {
			profileLoading = false;
		}
	}

	async function handlePasswordChange() {
		passwordError = '';
		passwordSuccess = '';

		if (newPassword !== confirmPassword) {
			passwordError = $t('register.passwordMismatch');
			return;
		}
		if (newPassword.length < 12) {
			passwordError = $t('settings.passwordTooShort');
			return;
		}

		passwordLoading = true;

		try {
			const res = await fetch('/api/v1/account/password', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ currentPassword, newPassword })
			});
			const result = await res.json();

			if (!res.ok) {
				passwordError = result.error?.message || $t('common.error');
				return;
			}

			passwordSuccess = $t('settings.passwordChanged');
			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
		} catch {
			passwordError = $t('common.error');
		} finally {
			passwordLoading = false;
		}
	}

	function kycStatusLabel(level: number): string {
		if (level >= 2) return $t('settings.kyc.verified');
		if (level === 1) return $t('settings.kyc.basic');
		return $t('settings.kyc.unverified');
	}

	function kycStatusColor(level: number): string {
		if (level >= 2) return 'bg-green-50 text-green-600';
		if (level === 1) return 'bg-yellow-50 text-yellow-600';
		return 'bg-gray-100 text-gray-500';
	}
</script>

<svelte:head>
	<title>{$t('settings.title')} | TCEX</title>
</svelte:head>

<div class="space-y-6 pb-20 lg:pb-0">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">{$t('settings.title')}</h1>
		<p class="text-gray-500 mt-1">{$t('settings.subtitle')}</p>
	</div>

	<!-- Profile Section -->
	<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
		<div class="px-6 py-4 border-b border-gray-200">
			<h2 class="text-lg font-semibold text-gray-900">{$t('settings.profile')}</h2>
		</div>
		<form onsubmit={(e) => { e.preventDefault(); handleProfileUpdate(); }} class="p-6 space-y-4">
			<div>
				<label for="email" class="block text-sm font-medium text-gray-700 mb-1">{$t('settings.email')}</label>
				<input
					id="email"
					type="email"
					value={data.profile.email}
					disabled
					class="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
				/>
				<p class="mt-1 text-xs text-gray-400">{$t('settings.emailReadonly')}</p>
			</div>
			<div>
				<label for="displayName" class="block text-sm font-medium text-gray-700 mb-1">{$t('settings.displayName')}</label>
				<input
					id="displayName"
					type="text"
					bind:value={displayName}
					placeholder={$t('settings.displayNamePlaceholder')}
					class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
				/>
			</div>
			<div>
				<label for="phone" class="block text-sm font-medium text-gray-700 mb-1">{$t('settings.phone')}</label>
				<input
					id="phone"
					type="tel"
					bind:value={phone}
					placeholder={$t('settings.phonePlaceholder')}
					class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
				/>
			</div>

			{#if profileError}
				<p class="text-sm text-red-600">{profileError}</p>
			{/if}
			{#if profileSuccess}
				<p class="text-sm text-green-600">{profileSuccess}</p>
			{/if}

			<button
				type="submit"
				disabled={profileLoading}
				class="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
			>
				{profileLoading ? $t('common.loading') : $t('settings.saveProfile')}
			</button>
		</form>
	</div>

	<!-- Password Section -->
	<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
		<div class="px-6 py-4 border-b border-gray-200">
			<h2 class="text-lg font-semibold text-gray-900">{$t('settings.changePassword')}</h2>
		</div>
		<form onsubmit={(e) => { e.preventDefault(); handlePasswordChange(); }} class="p-6 space-y-4">
			<div>
				<label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-1">{$t('settings.currentPassword')}</label>
				<input
					id="currentPassword"
					type="password"
					bind:value={currentPassword}
					class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
				/>
			</div>
			<div>
				<label for="newPassword" class="block text-sm font-medium text-gray-700 mb-1">{$t('settings.newPassword')}</label>
				<input
					id="newPassword"
					type="password"
					bind:value={newPassword}
					placeholder={$t('settings.newPasswordPlaceholder')}
					class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
				/>
			</div>
			<div>
				<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">{$t('settings.confirmNewPassword')}</label>
				<input
					id="confirmPassword"
					type="password"
					bind:value={confirmPassword}
					class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
				/>
			</div>

			{#if passwordError}
				<p class="text-sm text-red-600">{passwordError}</p>
			{/if}
			{#if passwordSuccess}
				<p class="text-sm text-green-600">{passwordSuccess}</p>
			{/if}

			<button
				type="submit"
				disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
				class="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
			>
				{passwordLoading ? $t('common.loading') : $t('settings.updatePassword')}
			</button>
		</form>
	</div>

	<!-- KYC Status -->
	<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
		<div class="px-6 py-4 border-b border-gray-200">
			<h2 class="text-lg font-semibold text-gray-900">{$t('settings.kycTitle')}</h2>
		</div>
		<div class="p-6">
			<div class="flex items-center gap-3 mb-4">
				<span class="text-sm text-gray-700">{$t('settings.kycStatus')}:</span>
				<span class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium {kycStatusColor(data.profile.kycLevel)}">
					{kycStatusLabel(data.profile.kycLevel)}
				</span>
			</div>
			<p class="text-sm text-gray-500">{$t('settings.kycDescription')}</p>
		</div>
	</div>
</div>
