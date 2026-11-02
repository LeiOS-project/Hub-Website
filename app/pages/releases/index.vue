<script setup lang="ts">
/** Published LeiOS releases with their changelogs, newest first (`?page=`). */
import type { PublicOSRelease } from "~/utils/hubTypes";

usePageSeo({
	title: "LeiOS releases | LeiOS Hub",
	description: "Every published LeiOS release with its date and changelog, newest first.",
});

const PAGE_SIZE = 10;

const route = useRoute();

function queryValue(value: unknown): string {
	const first = Array.isArray(value) ? value[0] : value;
	return typeof first === "string" ? first : "";
}

const page = computed(() => {
	const value = Number.parseInt(queryValue(route.query.page), 10);
	return Number.isFinite(value) && value > 1 ? value : 1;
});

const {
	data: result,
	loading,
	refresh,
} = await useAPIAsyncData<{ items: PublicOSRelease[]; total: number } | null>(
	"public-os-releases",
	async () => {
		const res = await useAPI(
			(api) =>
				api.getOsReleases({
					query: { order: "newest", limit: PAGE_SIZE, offset: (page.value - 1) * PAGE_SIZE },
				}),
			true,
		);
		return res.success ? res.data : null;
	},
);

watch(page, () => {
	refresh();
	if (import.meta.client) window.scrollTo({ top: 0, behavior: "smooth" });
});

function pageLink(target: number) {
	return { query: { ...route.query, page: target > 1 ? String(target) : undefined } };
}

const total = computed(() => result.value?.total ?? 0);
</script>

<template>
	<div class="py-12">
		<UContainer class="max-w-4xl space-y-8">
			<header class="space-y-2">
				<UBadge color="primary" variant="soft">Releases</UBadge>
				<h1 class="text-3xl font-bold text-white sm:text-4xl">LeiOS releases</h1>
				<p class="max-w-2xl text-slate-400">
					Every published LeiOS release with its changelog. Package versions approved for stable
					reach the stable repository with the next release.
				</p>
			</header>

			<div v-if="loading && !result" class="flex justify-center py-16">
				<UIcon name="i-lucide-loader-2" class="animate-spin text-3xl text-slate-400" />
			</div>

			<UEmpty
				v-else-if="!result"
				variant="naked"
				icon="i-lucide-cloud-off"
				title="Releases could not be loaded"
				description="The release list is unavailable right now. Please try again in a moment."
				:actions="[
					{
						label: 'Try again',
						icon: 'i-lucide-refresh-cw',
						color: 'neutral',
						variant: 'outline',
						onClick: () => {
							refresh();
						},
					},
				]"
			/>

			<UEmpty
				v-else-if="!result.items.length"
				variant="naked"
				icon="i-lucide-history"
				:title="page > 1 ? 'This page is empty' : 'No releases yet'"
				:description="
					page > 1 ? 'There are fewer releases than this page needs.' : 'The first LeiOS release will show up here.'
				"
			>
				<template v-if="page > 1" #actions>
					<UButton color="neutral" variant="outline" :to="pageLink(1)">First page</UButton>
				</template>
			</UEmpty>

			<template v-else>
				<ol :class="['space-y-6 transition-opacity', loading ? 'opacity-60' : '']">
					<li v-for="(release, index) in result.items" :id="`release-${release.version}`" :key="release.version">
						<article
							class="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm"
						>
							<header
								class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-6 py-4"
							>
								<div class="flex min-w-0 items-center gap-3">
									<div
										class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10"
									>
										<UIcon name="i-lucide-tag" class="h-5 w-5 text-primary-400" />
									</div>
									<div class="min-w-0">
										<h2 class="flex flex-wrap items-center gap-2 font-semibold text-white">
											<span class="break-all">LeiOS {{ release.version }}</span>
											<UBadge
												v-if="page === 1 && index === 0"
												color="primary"
												variant="soft"
												size="sm"
											>
												Latest
											</UBadge>
										</h2>
										<p class="text-sm text-slate-400">
											Published <HubDate :value="release.published_at" />
										</p>
									</div>
								</div>
							</header>
							<div class="p-6">
								<MarkdownContent
									v-if="release.changelog"
									:value="release.changelog"
									class="text-slate-300"
								/>
								<p v-else class="text-sm text-slate-500">No changelog provided.</p>
							</div>
						</article>
					</li>
				</ol>

				<div v-if="total > PAGE_SIZE" class="flex justify-center">
					<UPagination :page="page" :total="total" :items-per-page="PAGE_SIZE" :to="pageLink" />
				</div>
			</template>
		</UContainer>
	</div>
</template>
