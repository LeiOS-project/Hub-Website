<script setup lang="ts">
/** Public publisher directory. Search and page live in the URL query (`?q=&page=`). */
import type { LocationQueryRaw } from "vue-router";
import type { PublicPublisher } from "~/utils/hubTypes";

usePageSeo({
	title: "Publishers | LeiOS Hub",
	description:
		"The people and teams publishing packages for LeiOS, with their verified status and packages.",
});

const PAGE_SIZE = 24;
const MIN_SEARCH_LENGTH = 3;
const SEARCH_DEBOUNCE_MS = 350;

const route = useRoute();
const router = useRouter();

function queryValue(value: unknown): string {
	const first = Array.isArray(value) ? value[0] : value;
	return typeof first === "string" ? first : "";
}

const searchTerm = computed(() => queryValue(route.query.q).trim());
const page = computed(() => {
	const value = Number.parseInt(queryValue(route.query.page), 10);
	return Number.isFinite(value) && value > 1 ? value : 1;
});
const searchTooShort = computed(
	() => searchTerm.value.length > 0 && searchTerm.value.length < MIN_SEARCH_LENGTH,
);

const apiQuery = computed(() => ({
	limit: PAGE_SIZE,
	offset: (page.value - 1) * PAGE_SIZE,
	// The API needs at least three characters; shorter input lists everyone.
	searchString: searchTooShort.value ? undefined : searchTerm.value || undefined,
}));

const {
	data: result,
	loading,
	refresh,
} = await useAPIAsyncData<{ items: PublicPublisher[]; total: number } | null>(
	"public-publishers",
	async () => {
		const res = await useAPI((api) => api.getPublishers({ query: apiQuery.value }), true);
		return res.success ? res.data : null;
	},
);

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

function clearSearch() {
	searchInput.value = "";
	updateQuery({ q: undefined, page: undefined });
}

function pageLink(target: number) {
	return { query: { ...route.query, page: target > 1 ? String(target) : undefined } };
}

const total = computed(() => result.value?.total ?? 0);
const resultLabel = computed(() => {
	if (!result.value) return "";
	const count = new Intl.NumberFormat("en-US").format(total.value);
	return `${count} ${total.value === 1 ? "publisher" : "publishers"}`;
});
</script>

<template>
	<div class="py-12">
		<UContainer class="space-y-8">
			<header class="space-y-2">
				<UBadge color="primary" variant="soft">Publishers</UBadge>
				<h1 class="text-3xl font-bold text-white sm:text-4xl">Who publishes for LeiOS</h1>
				<p class="max-w-2xl text-slate-400">
					People and teams that ship packages through the Hub. Verified publishers have been
					confirmed by the LeiOS team.
				</p>
			</header>

			<div>
				<UInput
					v-model="searchInput"
					icon="i-lucide-search"
					placeholder="Search publishers"
					size="lg"
					class="w-full md:max-w-md"
					aria-label="Search publishers"
					:loading="loading"
				/>
				<p v-if="searchTooShort" class="mt-1.5 text-xs text-slate-500">
					Type at least {{ MIN_SEARCH_LENGTH }} characters to search.
				</p>
			</div>

			<div class="flex min-h-6 items-center justify-between gap-4 text-sm text-slate-400">
				<span>{{ resultLabel }}</span>
				<UButton
					v-if="searchTerm"
					color="neutral"
					variant="link"
					icon="i-lucide-x"
					size="sm"
					@click="clearSearch();"
				>
					Clear search
				</UButton>
			</div>

			<div v-if="loading && !result" class="flex justify-center py-16">
				<UIcon name="i-lucide-loader-2" class="animate-spin text-3xl text-slate-400" />
			</div>

			<UEmpty
				v-else-if="!result"
				variant="naked"
				icon="i-lucide-cloud-off"
				title="Publishers could not be loaded"
				description="The publisher list is unavailable right now. Please try again in a moment."
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
				icon="i-lucide-building-2"
				title="No publishers found"
				:description="
					searchTerm
						? 'No publisher matches your search.'
						: page > 1
							? 'This page is empty.'
							: 'No publishers have been created yet.'
				"
			>
				<template v-if="searchTerm || page > 1" #actions>
					<UButton
						v-if="searchTerm"
						color="neutral"
						variant="outline"
						icon="i-lucide-x"
						@click="clearSearch();"
					>
						Clear search
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
					<HubPublisherCard
						v-for="publisher in result.items"
						:key="publisher.id"
						:publisher="publisher"
					/>
				</div>

				<div v-if="total > PAGE_SIZE" class="flex justify-center">
					<UPagination :page="page" :total="total" :items-per-page="PAGE_SIZE" :to="pageLink" />
				</div>
			</template>
		</UContainer>
	</div>
</template>
