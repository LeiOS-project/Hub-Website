<script setup lang="ts">
/**
 * Public package search. Search, sort, channel and page live in the URL query
 * (`?q=&sort=&channel=&page=`), so results can be shared and the back button works.
 */
import type { LocationQueryRaw } from "vue-router";
import type {
	PublicPackage,
	PublicPackageChannel,
	PublicPackageQuery,
	PublicPackageSort,
} from "~/utils/hubTypes";

usePageSeo({
	title: "Explore packages | LeiOS Hub",
	description:
		"Search and browse every package in the LeiOS repositories, with their stable and testing versions and publishers.",
});

const PAGE_SIZE = 24;
const MIN_SEARCH_LENGTH = 3;
const SEARCH_DEBOUNCE_MS = 350;

const route = useRoute();
const router = useRouter();

const sortItems: { label: string; value: PublicPackageSort }[] = [
	{ label: "Name (A–Z)", value: "name" },
	{ label: "Newest", value: "newest" },
	{ label: "Recently updated", value: "updated" },
];

type ChannelFilter = PublicPackageChannel | "all";
const channelItems: { label: string; value: ChannelFilter }[] = [
	{ label: "All channels", value: "all" },
	{ label: "Stable", value: "stable" },
	{ label: "Testing", value: "testing" },
];

function queryValue(value: unknown): string {
	const first = Array.isArray(value) ? value[0] : value;
	return typeof first === "string" ? first : "";
}

const searchTerm = computed(() => queryValue(route.query.q).trim());
const sort = computed<PublicPackageSort>(
	() => sortItems.find((item) => item.value === queryValue(route.query.sort))?.value ?? "name",
);
const channel = computed<ChannelFilter>(
	() =>
		channelItems.find((item) => item.value === queryValue(route.query.channel))?.value ?? "all",
);
const page = computed(() => {
	const value = Number.parseInt(queryValue(route.query.page), 10);
	return Number.isFinite(value) && value > 1 ? value : 1;
});

const searchTooShort = computed(
	() => searchTerm.value.length > 0 && searchTerm.value.length < MIN_SEARCH_LENGTH,
);
const hasFilters = computed(() => searchTerm.value.length > 0 || channel.value !== "all");

const apiQuery = computed<PublicPackageQuery>(() => ({
	limit: PAGE_SIZE,
	offset: (page.value - 1) * PAGE_SIZE,
	sort: sort.value,
	channel: channel.value === "all" ? undefined : channel.value,
	// The API needs at least three characters; shorter input lists everything.
	searchString: searchTooShort.value ? undefined : searchTerm.value || undefined,
}));

const {
	data: result,
	loading,
	refresh,
} = await useAPIAsyncData<{ items: PublicPackage[]; total: number } | null>(
	"explore-packages",
	async () => {
		const res = await useAPI((api) => api.getPackages({ query: apiQuery.value }), true);
		if (!res.success) return null;
		return { items: res.data.items as PublicPackage[], total: res.data.total };
	},
);

// Refetch only when the effective API query changes (not for every keystroke below 3 chars).
watch(
	() => JSON.stringify(apiQuery.value),
	() => refresh(),
);

watch(page, () => {
	if (import.meta.client) window.scrollTo({ top: 0, behavior: "smooth" });
});

function updateQuery(changes: Record<string, string | undefined>, replace = false) {
	const query: LocationQueryRaw = { ...route.query, ...changes };
	for (const key of Object.keys(query)) {
		if (query[key] === undefined || query[key] === "") delete query[key];
	}
	return replace ? router.replace({ query }) : router.push({ query });
}

// The input updates the URL after a short pause; the URL (back/forward) updates the input.
const searchInput = ref(queryValue(route.query.q));
let searchTimer: ReturnType<typeof setTimeout> | undefined;

watch(searchInput, (value) => {
	clearTimeout(searchTimer);
	searchTimer = setTimeout(() => {
		const q = value.trim();
		if (q === searchTerm.value) return;
		updateQuery({ q: q || undefined, page: undefined }, true);
	}, SEARCH_DEBOUNCE_MS);
});

watch(searchTerm, (q) => {
	if (q !== searchInput.value.trim()) searchInput.value = q;
});

onBeforeUnmount(() => clearTimeout(searchTimer));

function onSortChange(value: PublicPackageSort) {
	updateQuery({ sort: value === "name" ? undefined : value, page: undefined });
}

function onChannelChange(value: ChannelFilter) {
	updateQuery({ channel: value === "all" ? undefined : value, page: undefined });
}

function clearFilters() {
	searchInput.value = "";
	updateQuery({ q: undefined, channel: undefined, page: undefined });
}

function pageLink(target: number) {
	return { query: { ...route.query, page: target > 1 ? String(target) : undefined } };
}

const total = computed(() => result.value?.total ?? 0);
const resultLabel = computed(() => {
	if (!result.value) return "";
	const count = new Intl.NumberFormat("en-US").format(total.value);
	return `${count} ${total.value === 1 ? "package" : "packages"}`;
});
</script>

<template>
	<div class="py-12">
		<UContainer class="space-y-8">
			<header class="space-y-2">
				<UBadge color="primary" variant="soft">Explore</UBadge>
				<h1 class="text-3xl font-bold text-white sm:text-4xl">Browse LeiOS packages</h1>
				<p class="max-w-2xl text-slate-400">
					Every package in the LeiOS repositories, with its latest stable and testing versions.
				</p>
			</header>

			<div class="flex flex-col gap-3 md:flex-row md:items-start">
				<div class="flex-1">
					<UInput
						v-model="searchInput"
						icon="i-lucide-search"
						placeholder="Search packages"
						size="lg"
						class="w-full"
						aria-label="Search packages"
						:loading="loading"
					/>
					<p v-if="searchTooShort" class="mt-1.5 text-xs text-slate-500">
						Type at least {{ MIN_SEARCH_LENGTH }} characters to search.
					</p>
				</div>
				<div class="grid grid-cols-2 gap-3 md:flex">
					<USelect
						:model-value="sort"
						:items="sortItems"
						size="lg"
						class="w-full md:w-48"
						aria-label="Sort packages"
						@update:model-value="onSortChange"
					/>
					<USelect
						:model-value="channel"
						:items="channelItems"
						size="lg"
						class="w-full md:w-44"
						aria-label="Filter by channel"
						@update:model-value="onChannelChange"
					/>
				</div>
			</div>

			<div class="flex min-h-6 items-center justify-between gap-4 text-sm text-slate-400">
				<span>{{ resultLabel }}</span>
				<UButton
					v-if="hasFilters"
					color="neutral"
					variant="link"
					icon="i-lucide-x"
					size="sm"
					@click="clearFilters();"
				>
					Clear filters
				</UButton>
			</div>

			<div v-if="loading && !result" class="flex justify-center py-16">
				<UIcon name="i-lucide-loader-2" class="animate-spin text-3xl text-slate-400" />
			</div>

			<UEmpty
				v-else-if="!result"
				variant="naked"
				icon="i-lucide-cloud-off"
				title="Packages could not be loaded"
				description="The package list is unavailable right now. Please try again in a moment."
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
				icon="i-lucide-package-search"
				title="No packages found"
				:description="
					hasFilters
						? 'No package matches your search and filters.'
						: page > 1
							? 'This page is empty.'
							: 'No packages have been published yet.'
				"
			>
				<template v-if="hasFilters || page > 1" #actions>
					<UButton
						v-if="hasFilters"
						color="neutral"
						variant="outline"
						icon="i-lucide-x"
						@click="clearFilters();"
					>
						Clear filters
					</UButton>
					<UButton v-else color="neutral" variant="outline" :to="pageLink(1)">
						First page
					</UButton>
				</template>
			</UEmpty>

			<template v-else>
				<div
					:class="[
						'grid grid-cols-1 gap-6 transition-opacity md:grid-cols-2 xl:grid-cols-3',
						loading ? 'opacity-60' : '',
					]"
				>
					<HubPackageCard v-for="pkg in result.items" :key="pkg.id" :pkg="pkg" />
				</div>

				<div v-if="total > PAGE_SIZE" class="flex justify-center">
					<UPagination :page="page" :total="total" :items-per-page="PAGE_SIZE" :to="pageLink" />
				</div>
			</template>
		</UContainer>
	</div>
</template>
