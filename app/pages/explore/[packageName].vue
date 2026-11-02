<script setup lang="ts">
/**
 * Public package page: metadata, install command, versions per channel and architecture, release
 * history and a report button. A missing (or hidden) package renders the 404 error page.
 */
import type { AccordionItem, BreadcrumbItem } from "@nuxt/ui";
import type {
	PublicPackage,
	PublicPackageChannelVersions,
	PublicPackageRelease,
	PublicPublisher,
} from "~/utils/hubTypes";

const route = useRoute();
const fullPackageName = route.params.packageName as string;
// A package's full name is `<publisherName>.<packageName>`; publisher names never contain dots.
const publisherName = fullPackageName.split(".")[0] ?? fullPackageName;

const [{ data: packageResult }, { data: releaseData }, { data: publisher }] = await Promise.all([
	useAPIAsyncData(
		`public-package-${fullPackageName}`,
		async () =>
			await useAPI((api) => api.getPackagesByFullPackageName({ path: { fullPackageName } }), true),
	),
	useAPIAsyncData<PublicPackageRelease[]>(`public-package-releases-${fullPackageName}`, async () => {
		const res = await useAPI(
			(api) => api.getPackagesByFullPackageNameReleases({ path: { fullPackageName } }),
			true,
		);
		return res.success ? [...res.data].sort((a, b) => b.created_at - a.created_at) : [];
	}),
	useAPIAsyncData<PublicPublisher | null>(`public-package-publisher-${publisherName}`, async () => {
		const res = await useAPI(
			(api) => api.getPublishersByPublisherName({ path: { publisherName } }),
			true,
		);
		return res.success ? res.data : null;
	}),
]);

const loaded = packageResult.value;
if (!loaded?.success) {
	const code = Number(loaded?.code) || 500;
	throw createError({
		statusCode: code,
		statusMessage: code === 404 ? "Package not found" : loaded?.message || "Failed to load package",
		fatal: true,
	});
}

const pkg = loaded.data as PublicPackage;
const releases = computed(() => releaseData.value ?? []);

const title = pkg.display_name || pkg.name;
const publisherLabel = pkg.publisher_display_name || publisherName;
const isDeprecated = pkg.flags.includes("DEPRECATED");
const isSystemManaged = pkg.flags.includes("SYSTEM-MANAGED");
const installCommand = `sudo apt install ${pkg.fullname}`;

function hasVersion(versions: PublicPackageChannelVersions) {
	return Boolean(versions.amd64 || versions.arm64);
}
const inStable = hasVersion(pkg.latest_stable_release);
const inTesting = hasVersion(pkg.latest_testing_release);

const versionRows = [
	{
		label: "Stable",
		color: "success" as const,
		repository: "leios-stable",
		versions: pkg.latest_stable_release,
	},
	{
		label: "Testing",
		color: "info" as const,
		repository: "leios-testing",
		versions: pkg.latest_testing_release,
	},
];

const homepageHost = (() => {
	if (!pkg.homepage_url) return null;
	try {
		return new URL(pkg.homepage_url).host;
	} catch {
		return pkg.homepage_url;
	}
})();

type ReleaseItem = AccordionItem & {
	value: string;
	release: PublicPackageRelease;
	architectures: string[];
};

const releaseItems = computed<ReleaseItem[]>(() =>
	releases.value.map((release) => ({
		label: release.version_with_leios_patch,
		value: release.version_with_leios_patch,
		release,
		architectures: release.architectures.is_all
			? ["all"]
			: (["amd64", "arm64"] as const).filter((arch) => release.architectures[arch]),
	})),
);

const breadcrumbItems: BreadcrumbItem[] = [
	{ label: "Explore", icon: "i-lucide-compass", to: "/explore" },
	{ label: publisherLabel, to: `/publishers/${publisherName}` },
	{ label: title },
];

const latestVersion =
	pkg.latest_stable_release.amd64 ??
	pkg.latest_stable_release.arm64 ??
	pkg.latest_testing_release.amd64 ??
	pkg.latest_testing_release.arm64 ??
	undefined;

/** Whether a release is the version in stable right now (for any architecture). */
function isCurrentStable(release: PublicPackageRelease) {
	const version = release.version_with_leios_patch;
	return pkg.latest_stable_release.amd64 === version || pkg.latest_stable_release.arm64 === version;
}

/** The stable promotion worth showing publicly: denied requests stay with the publisher. */
function publicStableStatus(release: PublicPackageRelease) {
	const promotion = release.stable_promotion;
	return promotion && promotion.status !== "denied" ? promotion : null;
}

const plainDescription = markdownToPlainText(pkg.description, 300);

usePageSeo({
	title: `${title} (${pkg.fullname}) | LeiOS Hub`,
	description: plainDescription || `The LeiOS package ${pkg.fullname} by ${publisherLabel}.`,
	jsonLd: {
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		name: title,
		description: plainDescription || undefined,
		operatingSystem: "LeiOS",
		softwareVersion: latestVersion,
		publisher: { "@type": "Organization", name: publisherLabel },
	},
});
</script>

<template>
	<div class="py-12">
		<UContainer class="space-y-8">
			<UBreadcrumb :items="breadcrumbItems" />

			<header class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
				<div class="flex min-w-0 items-start gap-4">
					<div
						class="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-500/10"
					>
						<UIcon name="i-lucide-package" class="text-2xl text-primary-400" />
					</div>
					<div class="min-w-0 space-y-1">
						<div class="flex flex-wrap items-center gap-2">
							<h1 class="text-3xl font-bold break-words text-white">{{ title }}</h1>
							<UBadge v-if="isDeprecated" color="warning" variant="soft" icon="i-lucide-archive">
								Deprecated
							</UBadge>
							<UBadge v-if="isSystemManaged" color="neutral" variant="soft" icon="i-lucide-lock">
								System package
							</UBadge>
						</div>
						<p class="font-mono text-sm break-all text-slate-500">{{ pkg.fullname }}</p>
						<p class="flex flex-wrap items-center gap-1 text-sm text-slate-400">
							by
							<NuxtLink
								:to="`/publishers/${publisherName}`"
								class="text-slate-200 transition-colors hover:text-primary-400"
							>
								{{ publisherLabel }}
							</NuxtLink>
							<HubVerifiedBadge :verified-at="pkg.publisher_verified_at" />
						</p>
					</div>
				</div>

				<div class="flex flex-wrap gap-2">
					<UButton
						v-if="pkg.homepage_url"
						:to="pkg.homepage_url"
						target="_blank"
						rel="noopener noreferrer"
						icon="i-lucide-external-link"
						color="neutral"
						variant="outline"
					>
						Homepage
					</UButton>
					<HubReportButton target-type="package" :target-name="pkg.fullname" :target-label="title" />
				</div>
			</header>

			<UAlert
				v-if="isDeprecated"
				color="warning"
				variant="subtle"
				icon="i-lucide-triangle-alert"
				title="This package is deprecated"
				:description="
					pkg.moderation_note ||
					'It is no longer recommended and may be removed from the repositories in the future.'
				"
			/>

			<div class="grid gap-6 lg:grid-cols-3">
				<div class="min-w-0 space-y-6 lg:col-span-2">
					<DashboardSectionCard title="About" icon="i-lucide-info">
						<MarkdownContent
							v-if="pkg.description"
							:value="pkg.description"
							class="text-slate-300"
						/>
						<p v-else class="text-slate-500">No description provided.</p>
					</DashboardSectionCard>

					<DashboardSectionCard
						title="Install"
						description="Install it from the LeiOS repositories with apt."
						icon="i-lucide-terminal"
					>
						<div class="space-y-3">
							<HubCommandSnippet :command="installCommand" />
							<p v-if="!inStable && !inTesting" class="text-sm text-slate-500">
								No release is in the repositories yet, so the package can't be installed right
								now.
							</p>
							<p v-else-if="!inStable" class="text-sm text-slate-500">
								So far this package is only in the testing repository (<code class="font-mono"
									>leios-testing</code
								>).
							</p>
						</div>
					</DashboardSectionCard>

					<DashboardSectionCard
						title="Release history"
						:description="`${releases.length} ${releases.length === 1 ? 'release' : 'releases'}, newest first`"
						icon="i-lucide-history"
						flush
					>
						<UEmpty
							v-if="!releaseItems.length"
							variant="naked"
							icon="i-lucide-package-open"
							title="No releases yet"
							description="The publisher has not uploaded a release of this package."
							class="py-10"
						/>
						<UAccordion
							v-else
							:items="releaseItems"
							:default-value="releaseItems[0]?.value"
							:ui="{ root: 'px-6', trigger: 'py-4' }"
						>
							<template #default="{ item, index }">
								<span class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
									<span class="font-mono font-medium break-all text-white">{{ item.label }}</span>
									<UBadge v-if="index === 0" color="primary" variant="soft" size="sm">
										Latest
									</UBadge>
									<UBadge
										v-if="isCurrentStable(item.release)"
										color="success"
										variant="solid"
										size="sm"
										icon="i-lucide-shield-check"
									>
										In stable
									</UBadge>
									<HubStableStatusBadge
										v-else-if="publicStableStatus(item.release)"
										:status="publicStableStatus(item.release)!.status"
										:os-release-version="publicStableStatus(item.release)!.os_release_version"
									/>
									<span class="flex flex-wrap gap-1">
										<UBadge
											v-for="arch in item.architectures"
											:key="arch"
											color="neutral"
											variant="outline"
											size="sm"
										>
											{{ arch }}
										</UBadge>
									</span>
									<span class="text-xs font-normal text-slate-500">
										<HubDate :value="item.release.created_at" />
									</span>
								</span>
							</template>

							<template #body="{ item }">
								<MarkdownContent
									v-if="item.release.changelog"
									:value="item.release.changelog"
									compact
									class="text-slate-300"
								/>
								<p v-else class="text-sm text-slate-500">No changelog provided.</p>
							</template>
						</UAccordion>
					</DashboardSectionCard>
				</div>

				<aside class="min-w-0 space-y-6">
					<DashboardSectionCard title="Versions" icon="i-lucide-tags" flush>
						<div class="overflow-x-auto">
							<table class="w-full text-sm">
								<thead>
									<tr class="text-left text-xs tracking-wide text-slate-500 uppercase">
										<th scope="col" class="px-6 py-3 font-medium">Channel</th>
										<th scope="col" class="px-3 py-3 font-medium">amd64</th>
										<th scope="col" class="py-3 pr-6 pl-3 font-medium">arm64</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-slate-800 border-t border-slate-800">
									<tr v-for="row in versionRows" :key="row.label">
										<th scope="row" class="px-6 py-3 text-left font-normal">
											<UBadge :color="row.color" variant="subtle" size="sm">{{ row.label }}</UBadge>
										</th>
										<td class="px-3 py-3 font-mono break-all text-slate-200">
											{{ row.versions.amd64 ?? "–" }}
										</td>
										<td class="py-3 pr-6 pl-3 font-mono break-all text-slate-200">
											{{ row.versions.arm64 ?? "–" }}
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</DashboardSectionCard>

					<DashboardSectionCard title="Details" icon="i-lucide-list">
						<dl class="space-y-3 text-sm">
							<div class="flex justify-between gap-4">
								<dt class="text-slate-400">Created</dt>
								<dd class="text-right text-slate-200"><HubDate :value="pkg.created_at" /></dd>
							</div>
							<div class="flex justify-between gap-4">
								<dt class="text-slate-400">Last release</dt>
								<dd class="text-right text-slate-200">
									<HubDate :value="pkg.last_release_at" fallback="Never" />
								</dd>
							</div>
							<div v-if="homepageHost" class="flex justify-between gap-4">
								<dt class="shrink-0 text-slate-400">Homepage</dt>
								<dd class="min-w-0 truncate text-right">
									<NuxtLink
										:to="pkg.homepage_url"
										target="_blank"
										rel="noopener noreferrer"
										class="text-primary-400 hover:underline"
									>
										{{ homepageHost }}
									</NuxtLink>
								</dd>
							</div>
						</dl>
					</DashboardSectionCard>

					<DashboardSectionCard title="Publisher" icon="i-lucide-building-2">
						<div class="space-y-3">
							<div class="flex items-center gap-2">
								<span class="min-w-0 truncate font-medium text-white">{{ publisherLabel }}</span>
								<HubVerifiedBadge :verified-at="pkg.publisher_verified_at" label size="sm" />
							</div>
							<p class="font-mono text-xs text-slate-500">@{{ publisherName }}</p>
							<p v-if="publisher?.description" class="line-clamp-4 text-sm text-slate-400">
								{{ markdownToPlainText(publisher.description) }}
							</p>
							<UButton
								:to="`/publishers/${publisherName}`"
								color="neutral"
								variant="outline"
								trailing-icon="i-lucide-arrow-right"
								block
							>
								View publisher
							</UButton>
						</div>
					</DashboardSectionCard>
				</aside>
			</div>
		</UContainer>
	</div>
</template>
