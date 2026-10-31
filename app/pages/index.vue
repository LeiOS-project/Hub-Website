<script setup lang="ts">
/**
 * Public landing page — hero with live stats, recently updated packages, features, how
 * publishing works and a closing CTA (the style guide's nuxt-app landing page, with real data).
 */
import { useUserInfoStore } from "~/composables/stores/useUserStore";
import type { HubStats, PublicPackage } from "~/utils/hubTypes";

usePageSeo({
	title: "LeiOS Hub — Packages for the LeiOS operating system",
	description:
		"Find, install and publish packages for LeiOS. Browse the stable and testing repositories, verified publishers and every LeiOS release.",
	jsonLd: {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: "LeiOS Hub",
		description: "Package repository hub for the LeiOS operating system.",
	},
});

const user = await useUserInfoStore().use();

const [stats, recentPackages] = await Promise.all([
	useAPIAsyncData<HubStats | null>("hub-stats", async () => {
		const res = await useAPI((api) => api.getMetaStats({}), true);
		return res.success ? res.data : null;
	}),
	useAPIAsyncData<PublicPackage[] | null>("hub-recent-packages", async () => {
		const res = await useAPI(
			(api) => api.getPackages({ query: { sort: "updated", limit: 6 } }),
			true,
		);
		return res.success ? (res.data.items as PublicPackage[]) : null;
	}),
]);

const numberFormat = new Intl.NumberFormat("en-US");

const statItems = computed(() => {
	const data = stats.data.value;
	const format = (value: number | undefined) => (value === undefined ? "–" : numberFormat.format(value));
	return [
		{ label: "Packages", value: format(data?.packages), to: "/explore" },
		{ label: "Publishers", value: format(data?.publishers), to: "/publishers" },
		{ label: "Releases", value: format(data?.releases), to: "/explore?sort=updated" },
		{
			label: "Latest LeiOS",
			value: data?.latest_os_release?.version ?? "–",
			to: "/releases",
		},
	];
});

const features = [
	{
		icon: "i-lucide-compass",
		title: "Open to browse",
		description:
			"Every listed package, its releases and changelogs are public. No account needed to look around.",
	},
	{
		icon: "i-lucide-git-branch",
		title: "Stable and testing",
		description:
			"New uploads land in testing first. Stable versions are reviewed and ship with the next LeiOS release.",
	},
	{
		icon: "i-lucide-badge-check",
		title: "Verified publishers",
		description:
			"Publishers confirmed by the LeiOS team carry a verified badge, so you know who is behind a package.",
	},
	{
		icon: "i-lucide-cpu",
		title: "amd64 and arm64",
		description:
			"Releases are built per architecture, and the Hub shows which version each channel offers.",
	},
	{
		icon: "i-lucide-terminal",
		title: "Installs with apt",
		description:
			"Packages come straight from the LeiOS repositories: copy the install command from any package page.",
	},
	{
		icon: "i-lucide-flag",
		title: "Moderated",
		description:
			"Spotted malware, spam or a broken package? Report it and the moderators take a look.",
	},
];

const steps = [
	{
		icon: "i-lucide-user-plus",
		title: "Get an account",
		description: "Sign up for a LeiOS Hub account and confirm your email address.",
	},
	{
		icon: "i-lucide-building-2",
		title: "Set up a publisher",
		description: "Create a publisher for yourself or your team and invite members.",
	},
	{
		icon: "i-lucide-upload",
		title: "Upload releases",
		description: "Add packages and upload builds for amd64 and arm64; they go to testing.",
	},
	{
		icon: "i-lucide-rocket",
		title: "Go stable",
		description: "Request stable promotion; approved releases ship with the next LeiOS release.",
	},
];
</script>

<template>
	<div>
		<HubMetaProvider v-slot="{ signupEnabled }">
			<!-- Hero -->
			<section
				class="relative flex min-h-[85vh] items-center overflow-hidden bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(56,189,248,0.15),transparent)] py-20"
			>
				<div class="pointer-events-none absolute inset-0 overflow-hidden">
					<div class="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary-500/10 blur-3xl"></div>
					<div class="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-primary-400/5 blur-3xl"></div>
				</div>

				<UContainer class="relative z-10">
					<div class="mx-auto max-w-4xl text-center">
						<UBadge color="primary" variant="soft" size="xl" class="mb-6 inline-flex items-center gap-1">
							<UIcon name="i-lucide-package-search" />
							The LeiOS package hub
						</UBadge>

						<h1 class="mb-6 text-4xl leading-[1.1] font-bold tracking-tight sm:text-5xl md:text-7xl">
							Software for LeiOS,
							<span class="bg-linear-to-tr from-primary-400 to-primary-200 bg-clip-text text-transparent">
								in one place
							</span>
						</h1>

						<p class="mx-auto mb-8 max-w-2xl text-lg leading-[1.6] text-slate-400 sm:text-xl lg:text-2xl">
							Find and install packages from the LeiOS repositories, see who publishes them, and
							ship your own software to every LeiOS user.
						</p>

						<div class="mb-12 flex flex-col justify-center gap-4 sm:flex-row">
							<UButton to="/explore" size="xl" color="primary" class="justify-center px-8">
								<template #leading>
									<UIcon name="i-lucide-compass" />
								</template>
								Explore packages
							</UButton>
							<UButton
								v-if="user"
								to="/dashboard"
								size="xl"
								color="neutral"
								variant="outline"
								class="justify-center px-8"
							>
								<template #leading>
									<UIcon name="i-lucide-layout-dashboard" />
								</template>
								Open dashboard
							</UButton>
							<UButton
								v-else-if="signupEnabled"
								to="/auth/signup"
								size="xl"
								color="neutral"
								variant="outline"
								class="justify-center px-8"
							>
								<template #leading>
									<UIcon name="i-lucide-user-plus" />
								</template>
								Create an account
							</UButton>
						</div>

						<div class="mx-auto grid max-w-3xl grid-cols-2 gap-6 text-center md:grid-cols-4">
							<NuxtLink
								v-for="stat in statItems"
								:key="stat.label"
								:to="stat.to"
								class="group space-y-1 rounded-lg p-2 transition-colors hover:bg-slate-900/60"
							>
								<div class="truncate text-2xl font-bold text-primary-400 md:text-3xl">
									{{ stat.value }}
								</div>
								<div class="text-sm text-slate-500 transition-colors group-hover:text-slate-300">
									{{ stat.label }}
								</div>
							</NuxtLink>
						</div>
					</div>
				</UContainer>
			</section>

			<!-- Recently updated -->
			<section class="bg-slate-950/50 py-24">
				<UContainer>
					<header class="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
						<div>
							<UBadge color="primary" variant="soft" size="xl" class="mb-3">Fresh releases</UBadge>
							<h2 class="text-3xl font-bold sm:text-4xl">Recently updated</h2>
							<p class="mt-3 max-w-2xl text-lg text-slate-400">
								The packages that got a new release most recently.
							</p>
						</div>
						<UButton
							to="/explore?sort=updated"
							color="neutral"
							variant="ghost"
							trailing-icon="i-lucide-arrow-right"
							class="self-start sm:self-auto"
						>
							View all
						</UButton>
					</header>

					<div
						v-if="recentPackages.data.value?.length"
						class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
					>
						<HubPackageCard v-for="pkg in recentPackages.data.value" :key="pkg.id" :pkg="pkg" />
					</div>
					<UEmpty
						v-else
						variant="naked"
						icon="i-lucide-package"
						:title="recentPackages.data.value ? 'No packages yet' : 'Packages are unavailable right now'"
						:description="
							recentPackages.data.value
								? 'The first packages will show up here once they are published.'
								: 'The package list could not be loaded. Please try again later.'
						"
					/>
				</UContainer>
			</section>

			<!-- Features -->
			<section id="features" class="relative py-24">
				<div
					class="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent via-primary-500/5 to-transparent"
				></div>
				<UContainer class="relative z-10">
					<header class="mb-12 text-center">
						<UBadge color="primary" variant="soft" size="xl" class="mb-3">Why the Hub</UBadge>
						<h2 class="mb-3 text-3xl font-bold sm:text-4xl lg:text-5xl">Built for LeiOS users</h2>
						<p class="mx-auto max-w-3xl text-lg text-slate-400">
							One place to discover software for LeiOS and to see where it comes from.
						</p>
					</header>

					<div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
						<UCard
							v-for="feature in features"
							:key="feature.title"
							class="border-slate-800 bg-slate-900/50 transition duration-300 hover:-translate-y-1 hover:border-primary-400/50"
						>
							<div class="space-y-3 p-2">
								<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-500/10">
									<UIcon :name="feature.icon" class="text-xl text-primary-400" />
								</div>
								<h3 class="text-lg font-semibold">{{ feature.title }}</h3>
								<p class="leading-relaxed text-slate-400">{{ feature.description }}</p>
							</div>
						</UCard>
					</div>
				</UContainer>
			</section>

			<!-- How publishing works -->
			<section class="bg-slate-950/50 py-24">
				<UContainer>
					<header class="mb-12 text-center">
						<UBadge color="primary" variant="soft" size="xl" class="mb-3">For developers</UBadge>
						<h2 class="mb-3 text-3xl font-bold sm:text-4xl lg:text-5xl">Publish your software</h2>
						<p class="mx-auto max-w-3xl text-lg text-slate-400">
							From your first upload to the stable repository in four steps.
						</p>
					</header>

					<div class="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 xl:grid-cols-4">
						<UCard
							v-for="(step, index) in steps"
							:key="step.title"
							class="border-slate-800 bg-slate-900/80"
						>
							<div class="space-y-3 p-2">
								<div class="flex items-center gap-3">
									<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-500/10">
										<UIcon :name="step.icon" class="text-xl text-primary-400" />
									</div>
									<span class="text-sm font-semibold text-slate-500">Step {{ index + 1 }}</span>
								</div>
								<h3 class="text-lg font-semibold">{{ step.title }}</h3>
								<p class="leading-relaxed text-slate-400">{{ step.description }}</p>
							</div>
						</UCard>
					</div>
				</UContainer>
			</section>

			<!-- CTA -->
			<section class="relative overflow-hidden py-28">
				<div
					class="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent via-primary-500/5 to-transparent"
				></div>
				<UContainer class="relative z-10">
					<div class="mx-auto max-w-3xl text-center">
						<h2 class="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
							Ready to
							<span class="bg-linear-to-tr from-primary-400 to-primary-200 bg-clip-text text-transparent">
								publish
							</span>?
						</h2>
						<p class="mx-auto mb-8 max-w-2xl text-lg text-slate-400">
							{{
								user
									? "Head to your dashboard to create a publisher, add packages and upload releases."
									: signupEnabled
										? "Create an account to set up a publisher and upload your first package."
										: "Log in with your LeiOS Hub account to manage your publishers and packages."
							}}
						</p>
						<div class="flex flex-col justify-center gap-4 sm:flex-row">
							<UButton
								v-if="user"
								to="/dashboard"
								size="xl"
								color="primary"
								icon="i-lucide-layout-dashboard"
								class="justify-center px-8"
							>
								Open dashboard
							</UButton>
							<UButton
								v-else-if="signupEnabled"
								to="/auth/signup"
								size="xl"
								color="primary"
								icon="i-lucide-user-plus"
								class="justify-center px-8"
							>
								Create an account
							</UButton>
							<UButton
								v-else
								to="/auth/login"
								size="xl"
								color="primary"
								icon="i-lucide-log-in"
								class="justify-center px-8"
							>
								Log in
							</UButton>
							<UButton
								to="/releases"
								size="xl"
								color="neutral"
								variant="outline"
								icon="i-lucide-history"
								class="justify-center px-8"
							>
								LeiOS releases
							</UButton>
						</div>
					</div>
				</UContainer>
			</section>
		</HubMetaProvider>
	</div>
</template>
