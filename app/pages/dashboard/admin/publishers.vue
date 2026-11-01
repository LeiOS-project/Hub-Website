<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from "@nuxt/ui";
import { watchDebounced } from "@vueuse/core";
import type { AdminPage, AdminPublisher } from "~/utils/adminTypes";

definePageMeta({
	layout: "dashboard",
});

useSeoMeta({
	title: "All Publishers | LeiOS Hub",
	description: "Verify and manage all publishers",
});

const toast = useToast();
const route = useRoute();
const router = useRouter();

const VERIFIED_ITEMS: { label: string; value: "all" | "true" | "false" }[] = [
	{ label: "All publishers", value: "all" },
	{ label: "Verified", value: "true" },
	{ label: "Not verified", value: "false" },
];

// Initial filters come from the URL so filtered views can be linked and survive a reload.
const filters = reactive({
	search: typeof route.query.search === "string" ? route.query.search : "",
	verified: VERIFIED_ITEMS.find((i) => i.value === route.query.verified)?.value ?? "all",
});

const page = ref(1);
const pageSize = ref(25);

const {
	data: publishersPage,
	loading,
	refresh,
} = await useAPILazyAsyncData<AdminPage<AdminPublisher>>("admin-publishers-list", async () => {
	const search = filters.search.trim();
	const res = await useAPI((api) =>
		api.getAdminPublishers({
			query: {
				search: search || undefined,
				verified: filters.verified === "all" ? undefined : filters.verified,
				limit: pageSize.value,
				offset: (page.value - 1) * pageSize.value,
			},
		}),
	);

	if (!res.success) {
		toast.add({ title: "Failed to load publishers", description: res.message, color: "error" });
		return { items: [], total: 0 };
	}

	// The page ran past the end: jump to the last page.
	if (res.data.items.length === 0 && res.data.total > 0 && page.value > 1) {
		page.value = Math.ceil(res.data.total / pageSize.value);
	}
	return res.data;
});

function reloadFromFirstPage() {
	router.replace({
		query: {
			search: filters.search.trim() || undefined,
			verified: filters.verified === "all" ? undefined : filters.verified,
		},
	});

	if (page.value !== 1) {
		page.value = 1; // the page watcher reloads
	} else {
		refresh();
	}
}

watch(page, () => refresh());
watch(pageSize, reloadFromFirstPage);
watch(() => filters.verified, reloadFromFirstPage);
watchDebounced(() => filters.search, reloadFromFirstPage, { debounce: 300 });

const hasActiveFilters = computed(() => filters.search.trim() !== "" || filters.verified !== "all");

function resetFilters() {
	filters.search = "";
	filters.verified = "all";
}

const columns: TableColumn<AdminPublisher>[] = [
	{ id: "publisher", header: "Publisher" },
	{ accessorKey: "owner_username", header: "Owner" },
	{ accessorKey: "package_count", header: "Packages" },
	{ accessorKey: "member_count", header: "Members" },
	{ accessorKey: "verified_at", header: "Verified" },
	{ id: "actions", header: "", enableSorting: false, enableHiding: false },
];

function getRowActions(publisher: AdminPublisher): DropdownMenuItem[][] {
	return [
		[
			{
				label: "Public profile",
				icon: "i-lucide-external-link",
				to: `/publishers/${publisher.name}`,
			},
			{
				label: "Manage",
				icon: "i-lucide-settings",
				to: `/dashboard/publishers/${publisher.name}`,
			},
			{
				label: "Members",
				icon: "i-lucide-users",
				to: `/dashboard/publishers/${publisher.name}/members`,
			},
		],
		[
			{
				label: "Packages",
				icon: "i-lucide-package-search",
				to: `/dashboard/admin/packages?publisher=${encodeURIComponent(publisher.name)}`,
			},
			{
				label: "Owner",
				icon: "i-lucide-user",
				to: `/dashboard/admin/users/${publisher.owner_user_id}`,
			},
			{
				label: "Audit log",
				icon: "i-lucide-scroll-text",
				to: `/dashboard/admin/audit-log?target_type=publisher&target_id=${publisher.id}`,
			},
		],
	];
}

// Verify / unverify
const togglingVerification = ref<number | null>(null);

async function toggleVerification(publisher: AdminPublisher) {
	const verify = !publisher.verified_at;
	togglingVerification.value = publisher.id;

	const res = await useAPI((api) =>
		verify
			? api.postAdminPublishersByPublisherNameVerify({ path: { publisherName: publisher.name } })
			: api.postAdminPublishersByPublisherNameUnverify({ path: { publisherName: publisher.name } }),
	);
	togglingVerification.value = null;

	if (!res.success) {
		toast.add({
			title: verify ? "Failed to verify the publisher" : "Failed to remove the verification",
			description: res.message,
			icon: "i-lucide-circle-alert",
			color: "error",
		});
		return;
	}

	toast.add({
		title: verify ? "Publisher verified" : "Verification removed",
		description: verify
			? `${publisher.display_name} now shows the verified badge.`
			: `${publisher.display_name} no longer shows the verified badge.`,
		icon: "i-lucide-check",
		color: "success",
	});
	await refresh();
}
</script>

<template>
	<UDashboardPanel>
		<template #header>
			<DashboardPageHeader
				title="Publishers"
				icon="i-lucide-building-2"
				description="Verify and manage all publishers"
			/>
		</template>

		<template #body>
			<DashboardPageBody>
				<DashboardDataTable
					:data="publishersPage?.items ?? []"
					:columns="columns"
					:loading="loading"
					:default-page-size="100"
					:empty-title="hasActiveFilters ? 'No matching publishers' : 'No publishers'"
					:empty-description="
						hasActiveFilters ? 'Try other filters.' : 'Publishers appear here once developers create them.'
					"
					empty-icon="i-lucide-building-2"
					@refresh="refresh()"
				>
					<template #header-left>
						<UInput
							v-model="filters.search"
							icon="i-lucide-search"
							placeholder="Search name or display name..."
							:maxlength="64"
							class="w-full sm:w-auto sm:min-w-64"
						/>
						<USelect
							v-model="filters.verified"
							:items="VERIFIED_ITEMS"
							class="w-full sm:w-auto sm:min-w-40"
						/>
						<UButton
							v-if="hasActiveFilters"
							label="Reset"
							icon="i-lucide-x"
							color="neutral"
							variant="ghost"
							@click="resetFilters();"
						/>
					</template>

					<template #publisher-cell="{ row }">
						<div class="min-w-0">
							<div class="flex items-center gap-1.5">
								<NuxtLink
									:to="`/dashboard/publishers/${row.original.name}`"
									class="truncate font-medium text-white hover:underline"
								>
									{{ row.original.display_name }}
								</NuxtLink>
								<UTooltip v-if="row.original.verified_at" text="Verified publisher">
									<UIcon name="i-lucide-badge-check" class="size-4 shrink-0 text-primary-400" />
								</UTooltip>
							</div>
							<p class="truncate font-mono text-xs text-slate-400">{{ row.original.name }}</p>
						</div>
					</template>

					<template #owner_username-cell="{ row }">
						<NuxtLink
							:to="`/dashboard/admin/users/${row.original.owner_user_id}`"
							class="text-primary-400 hover:underline"
						>
							{{ row.original.owner_username }}
						</NuxtLink>
					</template>

					<template #package_count-cell="{ row }">
						<NuxtLink
							:to="`/dashboard/admin/packages?publisher=${encodeURIComponent(row.original.name)}`"
							class="font-mono text-sm text-slate-300 hover:text-primary-400 hover:underline"
						>
							{{ row.original.package_count }}
						</NuxtLink>
					</template>

					<template #member_count-cell="{ row }">
						<span class="font-mono text-sm text-slate-300">{{ row.original.member_count }}</span>
					</template>

					<template #verified_at-cell="{ row }">
						<UTooltip
							v-if="row.original.verified_at"
							:text="`Verified ${formatDate(row.original.verified_at)}`"
						>
							<UBadge color="primary" variant="soft" icon="i-lucide-badge-check">Verified</UBadge>
						</UTooltip>
						<span v-else class="text-sm text-slate-500">—</span>
					</template>

					<template #actions-cell="{ row }">
						<div class="flex items-center justify-end gap-1">
							<UButton
								:label="row.original.verified_at ? 'Unverify' : 'Verify'"
								:icon="row.original.verified_at ? 'i-lucide-badge-x' : 'i-lucide-badge-check'"
								:color="row.original.verified_at ? 'neutral' : 'primary'"
								variant="soft"
								size="xs"
								:loading="togglingVerification === row.original.id"
								:disabled="togglingVerification !== null && togglingVerification !== row.original.id"
								@click="toggleVerification(row.original);"
							/>
							<UDropdownMenu
								:ui="{ viewport: 'main-bg-color' }"
								:items="getRowActions(row.original)"
							>
								<UButton
									icon="i-lucide-more-horizontal"
									color="neutral"
									variant="ghost"
									size="xs"
									aria-label="More actions"
								/>
							</UDropdownMenu>
						</div>
					</template>

					<template #empty-actions>
						<UButton
							v-if="hasActiveFilters"
							label="Reset filters"
							color="neutral"
							variant="subtle"
							@click="resetFilters();"
						/>
					</template>

					<template #footer-left>
						<AdminPageSizeSelect
							v-model:page-size="pageSize"
							:page="page"
							:total="publishersPage?.total ?? 0"
						/>
					</template>

					<template #footer-right>
						<UPagination
							v-model:page="page"
							:total="publishersPage?.total ?? 0"
							:items-per-page="pageSize"
							:sibling-count="1"
							show-edges
						/>
					</template>
				</DashboardDataTable>
			</DashboardPageBody>
		</template>
	</UDashboardPanel>
</template>
