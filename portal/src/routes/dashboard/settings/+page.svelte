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
	let passwordTotpCode = $state('');
	let passwordLoading = $state(false);
	let passwordError = $state('');
	let passwordSuccess = $state('');

	// Email verification
	let emailOtp = $state('');
	let emailVerifyLoading = $state(false);
	let emailVerifyError = $state('');
	let emailVerifySuccess = $state('');
	let emailResendLoading = $state(false);

	// 2FA
	let totpUri = $state('');
	let totpBackupCodes = $state<string[]>([]);
	let totpSetupCode = $state('');
	let totpDisablePassword = $state('');
	let totpDisableCode = $state('');
	let twoFaLoading = $state(false);
	let twoFaError = $state('');
	let twoFaSuccess = $state('');
	let showTotpSetup = $state(false);
	let showTotpDisable = $state(false);

	// Phone verification
	let phoneNumber = $state('');
	let phoneOtp = $state('');
	let phoneSendLoading = $state(false);
	let phoneVerifyLoading = $state(false);
	let phoneError = $state('');
	let phoneSuccess = $state('');
	let phoneSent = $state(false);

	// KYC
	let kycFullName = $state('');
	let kycDob = $state('');
	let kycNationalId = $state('');
	let kycAddress = $state('');
	let kycLoading = $state(false);
	let kycError = $state('');
	let kycSuccess = $state('');

	// LINE
	let lineLoading = $state(false);
	let lineError = $state('');

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
			const result: any = await res.json();
			if (!res.ok) { profileError = result.error?.message || $t('common.error'); return; }
			profileSuccess = $t('settings.profileUpdated');
			await invalidateAll();
		} catch { profileError = $t('common.error'); }
		finally { profileLoading = false; }
	}

	async function handlePasswordChange() {
		passwordError = '';
		passwordSuccess = '';
		if (newPassword !== confirmPassword) { passwordError = $t('register.passwordMismatch'); return; }
		if (newPassword.length < 12) { passwordError = $t('settings.passwordTooShort'); return; }
		passwordLoading = true;
		try {
			const res = await fetch('/api/v1/account/password', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ currentPassword, newPassword, totpCode: passwordTotpCode || undefined })
			});
			const result: any = await res.json();
			if (!res.ok) { passwordError = result.error?.message || $t('common.error'); return; }
			passwordSuccess = $t('settings.passwordChanged');
			currentPassword = ''; newPassword = ''; confirmPassword = ''; passwordTotpCode = '';
		} catch { passwordError = $t('common.error'); }
		finally { passwordLoading = false; }
	}

	async function handleEmailVerify() {
		emailVerifyError = '';
		emailVerifySuccess = '';
		emailVerifyLoading = true;
		try {
			const res = await fetch('/api/v1/auth/verify-email', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ code: emailOtp })
			});
			const result: any = await res.json();
			if (!res.ok) { emailVerifyError = result.error?.message || $t('common.error'); return; }
			emailVerifySuccess = $t('verify.emailSuccess');
			emailOtp = '';
			await invalidateAll();
		} catch { emailVerifyError = $t('common.error'); }
		finally { emailVerifyLoading = false; }
	}

	async function handleEmailResend() {
		emailVerifyError = '';
		emailResendLoading = true;
		try {
			const res = await fetch('/api/v1/auth/resend-verification', { method: 'POST' });
			const result: any = await res.json();
			if (!res.ok) { emailVerifyError = result.error?.message || $t('common.error'); return; }
			emailVerifySuccess = $t('verify.emailResent');
		} catch { emailVerifyError = $t('common.error'); }
		finally { emailResendLoading = false; }
	}

	async function handleTotpSetup() {
		twoFaError = '';
		twoFaLoading = true;
		try {
			const res = await fetch('/api/v1/auth/2fa/setup', { method: 'POST' });
			const result: any = await res.json();
			if (!res.ok) { twoFaError = result.error?.message || $t('common.error'); return; }
			totpUri = result.uri;
			totpBackupCodes = result.backupCodes;
			showTotpSetup = true;
		} catch { twoFaError = $t('common.error'); }
		finally { twoFaLoading = false; }
	}

	async function handleTotpVerify() {
		twoFaError = '';
		twoFaLoading = true;
		try {
			const res = await fetch('/api/v1/auth/2fa/verify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ code: totpSetupCode })
			});
			const result: any = await res.json();
			if (!res.ok) { twoFaError = result.error?.message || $t('common.error'); return; }
			twoFaSuccess = $t('twofa.enabled');
			totpBackupCodes = result.backupCodes;
			showTotpSetup = false;
			totpSetupCode = '';
			await invalidateAll();
		} catch { twoFaError = $t('common.error'); }
		finally { twoFaLoading = false; }
	}

	async function handleTotpDisable() {
		twoFaError = '';
		twoFaLoading = true;
		try {
			const res = await fetch('/api/v1/auth/2fa/disable', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password: totpDisablePassword, totpCode: totpDisableCode })
			});
			const result: any = await res.json();
			if (!res.ok) { twoFaError = result.error?.message || $t('common.error'); return; }
			twoFaSuccess = $t('twofa.disabled');
			showTotpDisable = false;
			totpDisablePassword = ''; totpDisableCode = '';
			await invalidateAll();
		} catch { twoFaError = $t('common.error'); }
		finally { twoFaLoading = false; }
	}

	async function handleSendPhoneOtp() {
		phoneError = '';
		phoneSuccess = '';
		phoneSendLoading = true;
		try {
			const res = await fetch('/api/v1/auth/send-phone-otp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ phone: phoneNumber })
			});
			const result: any = await res.json();
			if (!res.ok) { phoneError = result.error?.message || $t('common.error'); return; }
			phoneSent = true;
			phoneSuccess = $t('kyc.phoneOtpSent');
		} catch { phoneError = $t('common.error'); }
		finally { phoneSendLoading = false; }
	}

	async function handleVerifyPhone() {
		phoneError = '';
		phoneVerifyLoading = true;
		try {
			const res = await fetch('/api/v1/auth/verify-phone', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ phone: phoneNumber, code: phoneOtp })
			});
			const result: any = await res.json();
			if (!res.ok) { phoneError = result.error?.message || $t('common.error'); return; }
			phoneSuccess = $t('kyc.phoneVerified');
			phoneOtp = '';
			phoneSent = false;
			await invalidateAll();
		} catch { phoneError = $t('common.error'); }
		finally { phoneVerifyLoading = false; }
	}

	async function handleKycApply(level: number) {
		kycError = '';
		kycSuccess = '';
		kycLoading = true;
		try {
			const payload: any = { level };
			if (level === 2) {
				payload.fullName = kycFullName;
				payload.dateOfBirth = kycDob;
				payload.nationalId = kycNationalId;
				payload.address = kycAddress;
			}
			const res = await fetch('/api/v1/kyc/apply', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			const result: any = await res.json();
			if (!res.ok) { kycError = result.error?.message || $t('common.error'); return; }
			kycSuccess = result.autoApproved ? $t('kyc.autoApproved') : $t('kyc.applicationSubmitted');
			await invalidateAll();
		} catch { kycError = $t('common.error'); }
		finally { kycLoading = false; }
	}

	async function handleLineUnlink() {
		lineError = '';
		lineLoading = true;
		try {
			const res = await fetch('/api/v1/auth/line/unlink', { method: 'POST' });
			const result: any = await res.json();
			if (!res.ok) { lineError = result.error?.message || $t('common.error'); return; }
			await invalidateAll();
		} catch { lineError = $t('common.error'); }
		finally { lineLoading = false; }
	}

	function kycStatusLabel(level: number): string {
		if (level >= 3) return 'L3';
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
				<div class="flex items-center gap-2">
					<input id="email" type="email" value={data.profile.email} disabled class="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500" />
					{#if data.profile.emailVerified}
						<span class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600">{$t('verify.verified')}</span>
					{:else}
						<span class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-600">{$t('verify.unverified')}</span>
					{/if}
				</div>
				<p class="mt-1 text-xs text-gray-400">{$t('settings.emailReadonly')}</p>
			</div>
			<div>
				<label for="displayName" class="block text-sm font-medium text-gray-700 mb-1">{$t('settings.displayName')}</label>
				<input id="displayName" type="text" bind:value={displayName} placeholder={$t('settings.displayNamePlaceholder')} class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
			</div>
			<div>
				<label for="phone" class="block text-sm font-medium text-gray-700 mb-1">{$t('settings.phone')}</label>
				<input id="phone" type="tel" bind:value={phone} placeholder={$t('settings.phonePlaceholder')} class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
			</div>
			{#if profileError}<p class="text-sm text-red-600">{profileError}</p>{/if}
			{#if profileSuccess}<p class="text-sm text-green-600">{profileSuccess}</p>{/if}
			<button type="submit" disabled={profileLoading} class="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
				{profileLoading ? $t('common.loading') : $t('settings.saveProfile')}
			</button>
		</form>
	</div>

	<!-- Email Verification Section -->
	{#if !data.profile.emailVerified}
		<div class="bg-white rounded-xl border border-yellow-200 overflow-hidden">
			<div class="px-6 py-4 border-b border-yellow-200 bg-yellow-50">
				<h2 class="text-lg font-semibold text-yellow-800">{$t('verify.emailTitle')}</h2>
			</div>
			<div class="p-6 space-y-4">
				<p class="text-sm text-gray-600">{$t('verify.emailDescription')}</p>
				<div class="flex gap-2">
					<input type="text" bind:value={emailOtp} maxlength="6" placeholder={$t('verify.enterCode')} class="w-40 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-center tracking-widest" />
					<button onclick={handleEmailVerify} disabled={emailVerifyLoading || emailOtp.length !== 6} class="px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
						{emailVerifyLoading ? $t('common.loading') : $t('verify.verify')}
					</button>
					<button onclick={handleEmailResend} disabled={emailResendLoading} class="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors">
						{emailResendLoading ? $t('common.loading') : $t('verify.resend')}
					</button>
				</div>
				{#if emailVerifyError}<p class="text-sm text-red-600">{emailVerifyError}</p>{/if}
				{#if emailVerifySuccess}<p class="text-sm text-green-600">{emailVerifySuccess}</p>{/if}
			</div>
		</div>
	{/if}

	<!-- Password Section -->
	<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
		<div class="px-6 py-4 border-b border-gray-200">
			<h2 class="text-lg font-semibold text-gray-900">{$t('settings.changePassword')}</h2>
		</div>
		<form onsubmit={(e) => { e.preventDefault(); handlePasswordChange(); }} class="p-6 space-y-4">
			<div>
				<label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-1">{$t('settings.currentPassword')}</label>
				<input id="currentPassword" type="password" bind:value={currentPassword} class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
			</div>
			<div>
				<label for="newPassword" class="block text-sm font-medium text-gray-700 mb-1">{$t('settings.newPassword')}</label>
				<input id="newPassword" type="password" bind:value={newPassword} placeholder={$t('settings.newPasswordPlaceholder')} class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
			</div>
			<div>
				<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">{$t('settings.confirmNewPassword')}</label>
				<input id="confirmPassword" type="password" bind:value={confirmPassword} class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
			</div>
			{#if data.profile.totpEnabled}
				<div>
					<label for="passwordTotpCode" class="block text-sm font-medium text-gray-700 mb-1">{$t('twofa.code')}</label>
					<input id="passwordTotpCode" type="text" bind:value={passwordTotpCode} maxlength="6" placeholder={$t('twofa.enterCode')} class="w-40 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-center tracking-widest" />
				</div>
			{/if}
			{#if passwordError}<p class="text-sm text-red-600">{passwordError}</p>{/if}
			{#if passwordSuccess}<p class="text-sm text-green-600">{passwordSuccess}</p>{/if}
			<button type="submit" disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword} class="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
				{passwordLoading ? $t('common.loading') : $t('settings.updatePassword')}
			</button>
		</form>
	</div>

	<!-- 2FA Section -->
	<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
		<div class="px-6 py-4 border-b border-gray-200">
			<h2 class="text-lg font-semibold text-gray-900">{$t('twofa.title')}</h2>
		</div>
		<div class="p-6 space-y-4">
			{#if data.profile.totpEnabled}
				<div class="flex items-center gap-3">
					<span class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600">{$t('twofa.statusEnabled')}</span>
					<p class="text-sm text-gray-600">{$t('twofa.enabledDescription')}</p>
				</div>
				{#if showTotpDisable}
					<div class="space-y-3 border-t pt-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">{$t('settings.currentPassword')}</label>
							<input type="password" bind:value={totpDisablePassword} class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">{$t('twofa.code')}</label>
							<input type="text" bind:value={totpDisableCode} maxlength="6" placeholder={$t('twofa.enterCode')} class="w-40 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-center tracking-widest" />
						</div>
						<div class="flex gap-2">
							<button onclick={handleTotpDisable} disabled={twoFaLoading} class="px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">{$t('twofa.confirmDisable')}</button>
							<button onclick={() => { showTotpDisable = false; }} class="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">{$t('common.cancel')}</button>
						</div>
					</div>
				{:else}
					<button onclick={() => { showTotpDisable = true; }} class="px-4 py-2.5 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors">{$t('twofa.disable')}</button>
				{/if}
			{:else}
				<p class="text-sm text-gray-600">{$t('twofa.description')}</p>
				{#if showTotpSetup}
					<div class="space-y-3 border-t pt-4">
						<p class="text-sm text-gray-700">{$t('twofa.scanQr')}</p>
						<div class="bg-gray-50 p-4 rounded-lg">
							<p class="text-xs text-gray-500 mb-2">{$t('twofa.manualEntry')}</p>
							<code class="text-xs break-all select-all">{totpUri}</code>
						</div>
						{#if totpBackupCodes.length > 0}
							<div class="bg-yellow-50 p-4 rounded-lg">
								<p class="text-sm font-medium text-yellow-800 mb-2">{$t('twofa.backupCodesTitle')}</p>
								<div class="grid grid-cols-2 gap-1">
									{#each totpBackupCodes as code}
										<code class="text-xs font-mono">{code}</code>
									{/each}
								</div>
							</div>
						{/if}
						<div class="flex gap-2 items-end">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">{$t('twofa.enterCode')}</label>
								<input type="text" bind:value={totpSetupCode} maxlength="6" placeholder="000000" class="w-40 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-center tracking-widest" />
							</div>
							<button onclick={handleTotpVerify} disabled={twoFaLoading || totpSetupCode.length !== 6} class="px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">{$t('twofa.activate')}</button>
						</div>
					</div>
				{:else}
					<button onclick={handleTotpSetup} disabled={twoFaLoading} class="px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">{$t('twofa.enable')}</button>
				{/if}
			{/if}
			{#if twoFaError}<p class="text-sm text-red-600">{twoFaError}</p>{/if}
			{#if twoFaSuccess}<p class="text-sm text-green-600">{twoFaSuccess}</p>{/if}
		</div>
	</div>

	<!-- KYC Status / Upgrade -->
	<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
		<div class="px-6 py-4 border-b border-gray-200">
			<h2 class="text-lg font-semibold text-gray-900">{$t('settings.kycTitle')}</h2>
		</div>
		<div class="p-6 space-y-4">
			<div class="flex items-center gap-3 mb-4">
				<span class="text-sm text-gray-700">{$t('settings.kycStatus')}:</span>
				<span class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium {kycStatusColor(data.profile.kycLevel)}">
					L{data.profile.kycLevel} — {kycStatusLabel(data.profile.kycLevel)}
				</span>
			</div>

			{#if data.kycApplication?.status === 'pending'}
				<div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
					<p class="text-sm text-blue-700">{$t('kyc.pendingReview')}</p>
				</div>
			{/if}

			<!-- L0 → L1: Requires email + phone verification -->
			{#if data.profile.kycLevel === 0}
				<div class="border rounded-lg p-4 space-y-3">
					<h3 class="font-medium text-gray-900">{$t('kyc.upgradeL1')}</h3>
					<p class="text-sm text-gray-600">{$t('kyc.l1Requirements')}</p>
					<ul class="text-sm text-gray-600 space-y-1">
						<li class="flex items-center gap-2">
							<span class={data.profile.emailVerified ? 'text-green-500' : 'text-gray-400'}>{data.profile.emailVerified ? '✓' : '○'}</span>
							{$t('kyc.emailVerification')}
						</li>
						<li class="flex items-center gap-2">
							<span class={data.profile.phoneVerified ? 'text-green-500' : 'text-gray-400'}>{data.profile.phoneVerified ? '✓' : '○'}</span>
							{$t('kyc.phoneVerification')}
						</li>
					</ul>

					<!-- Phone verification form -->
					{#if !data.profile.phoneVerified}
						<div class="border-t pt-3 space-y-2">
							<label class="block text-sm font-medium text-gray-700">{$t('kyc.phoneNumber')}</label>
							<div class="flex gap-2">
								<input type="tel" bind:value={phoneNumber} placeholder="09xxxxxxxx" class="w-40 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
								<button onclick={handleSendPhoneOtp} disabled={phoneSendLoading || !phoneNumber} class="px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
									{phoneSendLoading ? $t('common.loading') : $t('kyc.sendOtp')}
								</button>
							</div>
							{#if phoneSent}
								<div class="flex gap-2">
									<input type="text" bind:value={phoneOtp} maxlength="6" placeholder={$t('verify.enterCode')} class="w-40 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-center tracking-widest" />
									<button onclick={handleVerifyPhone} disabled={phoneVerifyLoading || phoneOtp.length !== 6} class="px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
										{phoneVerifyLoading ? $t('common.loading') : $t('verify.verify')}
									</button>
								</div>
							{/if}
							{#if phoneError}<p class="text-sm text-red-600">{phoneError}</p>{/if}
							{#if phoneSuccess}<p class="text-sm text-green-600">{phoneSuccess}</p>{/if}
						</div>
					{/if}

					{#if data.profile.emailVerified && data.profile.phoneVerified}
						<button onclick={() => handleKycApply(1)} disabled={kycLoading} class="px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
							{kycLoading ? $t('common.loading') : $t('kyc.applyL1')}
						</button>
					{/if}
				</div>
			{/if}

			<!-- L1 → L2: Requires personal info + ID document -->
			{#if data.profile.kycLevel === 1}
				<div class="border rounded-lg p-4 space-y-3">
					<h3 class="font-medium text-gray-900">{$t('kyc.upgradeL2')}</h3>
					<p class="text-sm text-gray-600">{$t('kyc.l2Requirements')}</p>
					<div class="space-y-3">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">{$t('kyc.fullName')}</label>
							<input type="text" bind:value={kycFullName} class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">{$t('kyc.dateOfBirth')}</label>
							<input type="date" bind:value={kycDob} class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">{$t('kyc.nationalId')}</label>
							<input type="text" bind:value={kycNationalId} placeholder="A123456789" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">{$t('kyc.address')}</label>
							<input type="text" bind:value={kycAddress} class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
						</div>
					</div>
					<button onclick={() => handleKycApply(2)} disabled={kycLoading || !kycFullName || !kycDob || !kycNationalId || !kycAddress} class="px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
						{kycLoading ? $t('common.loading') : $t('kyc.applyL2')}
					</button>
				</div>
			{/if}

			{#if data.profile.kycLevel >= 2}
				<p class="text-sm text-gray-500">{$t('kyc.l2Complete')}</p>
			{/if}

			{#if kycError}<p class="text-sm text-red-600">{kycError}</p>{/if}
			{#if kycSuccess}<p class="text-sm text-green-600">{kycSuccess}</p>{/if}
		</div>
	</div>

	<!-- LINE Account -->
	<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
		<div class="px-6 py-4 border-b border-gray-200">
			<h2 class="text-lg font-semibold text-gray-900">{$t('line.title')}</h2>
		</div>
		<div class="p-6 space-y-4">
			{#if data.lineAccount}
				<div class="flex items-center gap-3">
					{#if data.lineAccount.pictureUrl}
						<img src={data.lineAccount.pictureUrl} alt="" class="w-10 h-10 rounded-full" />
					{/if}
					<div>
						<p class="font-medium text-gray-900">{data.lineAccount.displayName}</p>
						<p class="text-xs text-gray-500">{$t('line.linked')}</p>
					</div>
				</div>
				<button onclick={handleLineUnlink} disabled={lineLoading} class="px-4 py-2.5 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 disabled:opacity-50 transition-colors">
					{lineLoading ? $t('common.loading') : $t('line.unlink')}
				</button>
			{:else}
				<p class="text-sm text-gray-600">{$t('line.description')}</p>
				<a href="/api/v1/auth/line" class="inline-flex px-4 py-2.5 bg-[#06C755] text-white rounded-lg font-medium hover:bg-[#05b34d] transition-colors">
					{$t('line.link')}
				</a>
			{/if}
			{#if lineError}<p class="text-sm text-red-600">{lineError}</p>{/if}
		</div>
	</div>
</div>
