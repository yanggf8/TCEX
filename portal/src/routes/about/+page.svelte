<script lang="ts">
	import { t } from '$lib/i18n';

	const milestones = [
		{ dateKey: 'about.milestones.m1.date', titleKey: 'about.milestones.m1.title', descKey: 'about.milestones.m1.desc', done: true },
		{ dateKey: 'about.milestones.m2.date', titleKey: 'about.milestones.m2.title', descKey: 'about.milestones.m2.desc', done: true },
		{ dateKey: 'about.milestones.m3.date', titleKey: 'about.milestones.m3.title', descKey: 'about.milestones.m3.desc', done: false }
	];
</script>

<svelte:head>
	<title>{$t('about.title')} | TCEX</title>
	<meta name="description" content={$t('about.subtitle')} />
</svelte:head>

<div class="container mx-auto px-4 py-12">
	<h1 class="text-3xl font-bold text-gray-900 mb-4">{$t('about.title')}</h1>

	<div class="max-w-3xl">
		<p class="text-gray-600 text-lg mb-12">{$t('about.subtitle')}</p>

		<!-- Mission -->
		<section class="mb-12">
			<h2 class="text-2xl font-semibold text-gray-900 mb-4">{$t('about.mission.title')}</h2>
			<p class="text-gray-600">{$t('about.mission.desc')}</p>
		</section>

		<!-- Core Values -->
		<section class="mb-12">
			<h2 class="text-2xl font-semibold text-gray-900 mb-6">{$t('about.values.title')}</h2>
			<div class="grid md:grid-cols-3 gap-6">
				<div class="bg-gray-50 rounded-lg p-6">
					<h3 class="font-semibold text-gray-900 mb-2">{$t('about.values.transparency')}</h3>
					<p class="text-gray-600 text-sm">{$t('about.values.transparencyDesc')}</p>
				</div>
				<div class="bg-gray-50 rounded-lg p-6">
					<h3 class="font-semibold text-gray-900 mb-2">{$t('about.values.compliance')}</h3>
					<p class="text-gray-600 text-sm">{$t('about.values.complianceDesc')}</p>
				</div>
				<div class="bg-gray-50 rounded-lg p-6">
					<h3 class="font-semibold text-gray-900 mb-2">{$t('about.values.innovation')}</h3>
					<p class="text-gray-600 text-sm">{$t('about.values.innovationDesc')}</p>
				</div>
			</div>
		</section>

		<!-- Team -->
		<section class="mb-12">
			<h2 class="text-2xl font-semibold text-gray-900 mb-4">{$t('about.team.title')}</h2>
			<p class="text-gray-600 mb-6">{$t('about.team.desc')}</p>
			<div class="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
				<div class="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
					<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
					</svg>
				</div>
				<p class="text-gray-500">{$t('about.team.comingSoon')}</p>
			</div>
		</section>

		<!-- Milestones -->
		<section class="mb-12">
			<h2 class="text-2xl font-semibold text-gray-900 mb-6">{$t('about.milestones.title')}</h2>
			<div class="relative">
				<div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
				<div class="space-y-8">
					{#each milestones as milestone}
						<div class="relative flex gap-6 pl-12">
							<div class="absolute left-2.5 w-3 h-3 rounded-full {milestone.done ? 'bg-primary-600' : 'bg-gray-300'} ring-4 ring-white"></div>
							<div>
								<span class="inline-block text-sm font-medium {milestone.done ? 'text-primary-600' : 'text-gray-400'} mb-1">
									{$t(milestone.dateKey)}
								</span>
								<h3 class="font-semibold text-gray-900">{$t(milestone.titleKey)}</h3>
								<p class="text-gray-600 text-sm mt-1">{$t(milestone.descKey)}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<!-- Regulatory Notice -->
		<section class="bg-primary-50 border border-primary-200 rounded-lg p-8">
			<h2 class="text-xl font-semibold text-gray-900 mb-2">{$t('about.regulatory.title')}</h2>
			<p class="text-gray-600">{$t('about.regulatory.desc')}</p>
		</section>
	</div>
</div>
