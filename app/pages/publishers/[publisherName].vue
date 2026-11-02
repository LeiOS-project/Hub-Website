<script setup lang="ts">
/**
 * Public publisher profile: details, maintainer contact, public members and the publisher's
 * packages (paginated, `?page=`). A missing publisher renders the 404 error page.
 */
import type { BreadcrumbItem } from "@nuxt/ui";
import type { PublicPackage, PublicPublisherMember } from "~/utils/hubTypes";

const PAGE_SIZE = 12;

const route = useRoute();
const publisherName = route.params.publisherName as string;

function queryValue(value: unknown): string {
	const first = Array.isArray(value) ? value[0] : value;
	return typeof first === "string" ? first : "";
}

const page = computed(() => {
	const value = Number.parseInt(queryValue(route.query.page), 10);
	return Number.isFinite(value) && value > 1 ? value : 1;
});

const [{ data: publisherResult }, { data: members }, packages] = await Promise.all([
	useAPIAsyncData(
		`public-publisher-${publisherName}`,
		async () =>
			await useAPI((api) => api.getPublishersByPublisherName({ path: { publisherName } }), true),
	),
	useAPIAsyncData<PublicPublisherMember[]>(`public-publisher-members-${publisherName}`, async () => {
		const res = await useAPI(
			(api) => api.getPublishersByPublisherNameMembers({ path: { publisherName } }),
			true,
		);
		return res.success ? res.data : [];
	}),
	useAPIAsyncData<{ items: PublicPackage[]; total: number } | null>(
		`public-publisher-packages-${publisherName}`,
		async () => {
			const res = await useAPI(
				(api) =>
					api.getPackages({
						query: {
							publisherName,
							sort: "name",
							limit: PAGE_SIZE,
							offset: (page.value - 1) * PAGE_SIZE,
						},
					}),
				true,
			);
			if (!res.success) return null;
			return { items: res.data.items as PublicPackage[], total: res.data.total };
		},
	),
]);

const loaded = publisherResult.value;
if (!loaded?.success) {
	const code = Number(loaded?.code) || 500;
	throw createError({
		statusCode: code,
		statusMessage:
			code === 404 ? "Publisher not found" : loaded?.message || "Failed to load publisher",
		fatal: true,
	});
}

const publisher = loaded.data;
const title = publisher.display_name || publisher.name;

const packageList = packages.data;
const packagesLoading = packages.loading;
const packageTotal = computed(() => packageList.value?.total ?? 0);

watch(page, () => packages.refresh());

// The `#packages` hash makes the router scroll back to the top of the package list.
function pageLink(target: number) {
	return {
		query: { ...route.query, page: target > 1 ? String(target) : undefined },
		hash: "#packages",
	};
}

const homepageHost = (() => {
	if (!publisher.homepage_url) return null;
	try {
		return new URL(publisher.homepage_url).host;
	} catch {
		return publisher.homepage_url;
	}
})();

// Publisher roles, strongest first: ADMIN > MAINTAINER > DEVELOPER > VIEWER.
const roleOrder: PublicPublisherMember["role"][] = ["ADMIN", "MAINTAINER", "DEVELOPER", "VIEWER"];
const roleColors: Record<PublicPublisherMember["role"], "primary" | "info" | "neutral"> = {
	ADMIN: "primary",
	MAINTAINER: "info",
	DEVELOPER: "neutral",
	VIEWER: "neutral",
};

const sortedMembers = computed(() =>
	[...(members.value ?? [])].sort(
		(a, b) =>
			roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role) ||
			(a.user_display_name || a.user_username).localeCompare(b.user_display_name || b.user_username),
	),
);

function roleLabel(role: PublicPublisherMember["role"]) {
	return role.charAt(0) + role.slice(1).toLowerCase();
}

const breadcrumbItems: BreadcrumbItem[] = [
	{ label: "Publishers", icon: "i-lucide-building-2", to: "/publishers" },
	{ label: title },
];

usePageSeo({
	title: `${title} | Publishers | LeiOS Hub`,
	description:
		markdownToPlainText(publisher.description, 300) || `Packages published for LeiOS by ${title}.`,
	jsonLd: {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: title,
		description: markdownToPlainText(publisher.description, 300) || undefined,
		url: publisher.homepage_url || undefined,
	},
});
</script>

<template>
	<div class="py-12">
		<UContainer class="space-y-8">
			<UBreadcrumb :items="breadcrumbItems" />

			<header class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
				<div class="flex min-w-0 items-start gap-4">
					<UAvatar :alt="title" size="3xl" class="shrink-0 bg-primary-500/10 text-primary-400" />
					<div class="min-w-0 space-y-1">
						<div class="flex flex-wrap items-center gap-2">
							<h1 class="text-3xl font-bold break-words text-white">{{ title }}</h1>
							<HubVerifiedBadge :verified-at="publisher.verified_at" label />
						</div>
						<p class="font-mono text-sm break-all text-slate-500">@{{ publisher.name }}</p>
					</div>
				</div>

				<div class="flex flex-wrap gap-2">
					<UButton
						v-if="publisher.homepage_url"
						:to="publisher.homepage_url"
						target="_blank"
						rel="noopener noreferrer"
						icon="i-lucide-external-link"
						color="neutral"
						variant="outline"
					>
						Homepage
					</UButton>
					<HubReportButton target-type="publisher" :target-name="publisher.name" :target-label="title" />
				</div>
			</header>

			<div class="grid gap-6 lg:grid-cols-3">
				<div class="min-w-0 space-y-6 lg:col-span-2">
					<DashboardSectionCard title="About" icon="i-lucide-info">
						<MarkdownContent
							v-if="publisher.description"
							:value="publisher.description"
							class="text-slate-300"
						/>
						<p v-else class="text-slate-500">No description provided.</p>
					</DashboardSectionCard>

					<section id="packages" class="scroll-mt-24 space-y-4">
						<div class="flex items-center justify-between gap-4">
							<h2 class="text-xl font-semibold text-white">Packages</h2>
							<span v-if="packageList" class="text-sm text-slate-400">
								{{ packageTotal }} {{ packageTotal === 1 ? "package" : "packages" }}
							</span>
						</div>

						<div v-if="packagesLoading && !packageList" class="flex justify-center py-10">
							<UIcon name="i-lucide-loader-2" class="animate-spin text-3xl text-slate-400" />
						</div>

						<UEmpty
							v-else-if="!packageList"
							variant="naked"
							icon="i-lucide-cloud-off"
							title="Packages could not be loaded"
							description="Please try again in a moment."
							:actions="[
								{
									label: 'Try again',
									icon: 'i-lucide-refresh-cw',
									color: 'neutral',
									variant: 'outline',
									onClick: () => {
										packages.refresh();
									},
								},
							]"
						/>

						<UEmpty
							v-else-if="!packageList.items.length"
							variant="naked"
							icon="i-lucide-package"
							title="No packages yet"
							:description="
								page > 1 ? 'This page is empty.' : `${title} has not published any packages yet.`
							"
						/>

						<template v-else>
							<div
								:class="[
									'grid grid-cols-1 gap-6 transition-opacity md:grid-cols-2',
									packagesLoading ? 'opacity-60' : '',
								]"
							>
								<HubPackageCard
									v-for="pkg in packageList.items"
									:key="pkg.id"
									:pkg="pkg"
									:show-publisher="false"
								/>
							</div>

							<div v-if="packageTotal > PAGE_SIZE" class="flex justify-center">
								<UPagination
									:page="page"
									:total="packageTotal"
									:items-per-page="PAGE_SIZE"
									:to="pageLink"
								/>
							</div>
						</template>
					</section>
				</div>

				<aside class="min-w-0 space-y-6">
					<DashboardSectionCard title="Details" icon="i-lucide-list">
						<dl class="space-y-3 text-sm">
							<div class="flex justify-between gap-4">
								<dt class="text-slate-400">Joined</dt>
								<dd class="text-right text-slate-200"><HubDate :value="publisher.created_at" /></dd>
							</div>
							<div class="flex justify-between gap-4">
								<dt class="text-slate-400">Verified</dt>
								<dd class="text-right text-slate-200">
									<HubDate :value="publisher.verified_at" fallback="Not verified" />
								</dd>
							</div>
							<div v-if="homepageHost" class="flex justify-between gap-4">
								<dt class="shrink-0 text-slate-400">Homepage</dt>
								<dd class="min-w-0 truncate text-right">
									<NuxtLink
										:to="publisher.homepage_url"
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

					<DashboardSectionCard
						v-if="publisher.maintainer_contact_name || publisher.maintainer_contact_email"
						title="Maintainer contact"
						icon="i-lucide-mail"
					>
						<div class="space-y-1 text-sm">
							<p v-if="publisher.maintainer_contact_name" class="font-medium text-white">
								{{ publisher.maintainer_contact_name }}
							</p>
							<NuxtLink
								v-if="publisher.maintainer_contact_email"
								:to="`mailto:${publisher.maintainer_contact_email}`"
								class="break-all text-primary-400 hover:underline"
							>
								{{ publisher.maintainer_contact_email }}
							</NuxtLink>
						</div>
					</DashboardSectionCard>

					<DashboardSectionCard
						title="Members"
						:description="`${sortedMembers.length} public ${sortedMembers.length === 1 ? 'member' : 'members'}`"
						icon="i-lucide-users"
						flush
					>
						<p v-if="!sortedMembers.length" class="px-6 py-4 text-sm text-slate-500">
							No public members.
						</p>
						<ul v-else class="divide-y divide-slate-800">
							<li
								v-for="member in sortedMembers"
								:key="member.id"
								class="flex items-center gap-3 px-6 py-3"
							>
								<UAvatar :alt="member.user_display_name || member.user_username" size="sm" />
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-medium text-white">
										{{ member.user_display_name || member.user_username }}
									</p>
									<p class="truncate font-mono text-xs text-slate-500">@{{ member.user_username }}</p>
								</div>
								<UBadge :color="roleColors[member.role]" variant="soft" size="sm">
									{{ roleLabel(member.role) }}
								</UBadge>
							</li>
						</ul>
					</DashboardSectionCard>
				</aside>
			</div>
		</UContainer>
	</div>
</template>
