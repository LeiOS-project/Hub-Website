<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { useUserInfoStore } from "~/composables/stores/useUserStore";
import type { AdminListOrder, AdminOSRelease, AdminPage } from "~/utils/adminTypes";

definePageMeta({
	layout: "dashboard",
});

useSeoMeta({
	title: "OS Releases | LeiOS Hub",
	description: "Manage OS Releases on LeiOS Hub",
});

const toast = useToast();
const route = useRoute();
const router = useRouter();

const ORDER_ITEMS: { label: string; value: AdminListOrder }[] = [
	{ label: "Newest first", value: "newest" },
	{ label: "Oldest first", value: "oldest" },
];

const order = ref<AdminListOrder>(
	ORDER_ITEMS.find((i) => i.value === route.query.order)?.value ?? "newest",
);
const page = ref(1);
const pageSize = ref(25);

const {
	data: osReleasesPage,
	loading,
	refresh,
} = await useAPILazyAsyncData<AdminPage<AdminOSRelease>>("admin-os-releases-list", async () => {
	const res = await useAPI((api) =>
		api.getAdminOsReleases({
			query: {
				order: order.value,
				limit: pageSize.value,
				offset: (page.value - 1) * pageSize.value,
			},
		}),
	);

	if (!res.success) {
		toast.add({ title: "Failed to load OS Releases", description: res.message, color: "error" });
		return { items: [], total: 0 };
	}

	// The page ran past the end: jump to the last page.
	if (res.data.items.length === 0 && res.data.total > 0 && page.value > 1) {
		page.value = Math.ceil(res.data.total / pageSize.value);
	}
	return res.data;
});

function reloadFromFirstPage() {
	router.replace({ query: { order: order.value === "newest" ? undefined : order.value } });

	if (page.value !== 1) {
		page.value = 1; // the page watcher reloads
	} else {
		refresh();
	}
}

watch(page, () => refresh());
watch([pageSize, order], reloadFromFirstPage);

const columns: TableColumn<AdminOSRelease>[] = [
	{ accessorKey: "version", header: "Version" },
	{ accessorKey: "package_count", header: "Packages" },
	{ accessorKey: "created_at", header: "Created At" },
	{ accessorKey: "publishing_status", header: "Publishing Status" },
	{ accessorKey: "published_at", header: "Published At" },
	{ id: "actions", header: "", enableSorting: false, enableHiding: false },
];

const user = await useUserInfoStore().use();
const isAdmin = computed(() => user.value?.role === "admin");

// How many releases wait in the stable queue for the next OS release.
const { data: queuedCount } = await useAPILazyAsyncData(
	"admin-os-releases-queue-count",
	async () => {
		const res = await useAPI((api) =>
			api.getAdminStablePromotionRequests({ query: { status: "queued", limit: 1 } }),
		);
		return res.success ? res.data.total : 0;
	},
);
</script>

<template>
	<UDashboardPanel>
		<template #header>
			<DashboardPageHeader
				title="OS Releases"
				icon="i-lucide-rocket"
				description="LeiOS releases move queued packages into stable"
			>
				<template #right>
					<UButton
						v-if="isAdmin"
						label="New Release"
						icon="i-lucide-plus"
						color="primary"
						to="/dashboard/admin/os-releases/new"
					/>
				</template>
			</DashboardPageHeader>
		</template>

		<template #body>
			<DashboardPageBody>
				<UAlert
					v-if="queuedCount"
					color="info"
					variant="subtle"
					icon="i-lucide-list-ordered"
					:title="`${queuedCount} ${queuedCount === 1 ? 'release is' : 'releases are'} queued for stable`"
					description="The next OS release can include them."
					:actions="[
						{
							label: 'View the queue',
							color: 'neutral',
							variant: 'outline',
							to: '/dashboard/admin/stable-promotion-requests?status=queued',
						},
						...(isAdmin
							? [{ label: 'Create OS release', icon: 'i-lucide-rocket', to: '/dashboard/admin/os-releases/new' }]
							: []),
					]"
				/>

				<DashboardDataTable
					:data="osReleasesPage?.items ?? []"
					:columns="columns"
					:loading="loading"
					:default-page-size="100"
					empty-title="No releases"
					empty-description="Create the first release to get started."
					empty-icon="i-lucide-rocket"
					@refresh="refresh()"
				>
					<template #header-left>
						<USelect v-model="order" :items="ORDER_ITEMS" class="w-full sm:w-auto sm:min-w-36" />
					</template>

					<template #version-cell="{ row }">
						<NuxtLink
							:to="`/dashboard/admin/os-releases/${row.original.version}`"
							class="font-medium text-primary-400 hover:underline"
						>
							{{ row.original.version }}
						</NuxtLink>
					</template>

					<template #package_count-cell="{ row }">
						<span class="text-sm text-slate-300">{{ row.original.package_count }}</span>
					</template>

					<template #created_at-cell="{ row }">
						<span class="whitespace-nowrap text-sm text-slate-400">
							{{ formatDate(row.original.created_at) }}
						</span>
					</template>

					<template #publishing_status-cell="{ row }">
						<AdminStatusBadge :status="row.original.publishing_status" />
					</template>

					<template #published_at-cell="{ row }">
						<span class="whitespace-nowrap text-sm text-slate-400">
							{{
								row.original.published_at && row.original.publishing_status === "completed"
									? formatDate(row.original.published_at)
									: "N / A"
							}}
						</span>
					</template>

					<template #actions-cell="{ row }">
						<div class="flex justify-end gap-1">
							<UTooltip text="Publishing logs">
								<UButton
									:to="`/dashboard/admin/os-releases/${row.original.version}/logs`"
									icon="i-lucide-file-text"
									color="neutral"
									variant="ghost"
									size="xs"
									aria-label="Publishing logs"
								/>
							</UTooltip>
						</div>
					</template>

					<template #empty-actions>
						<UButton
							v-if="isAdmin"
							label="Create Release"
							color="primary"
							to="/dashboard/admin/os-releases/new"
						/>
					</template>

					<template #footer-left>
						<AdminPageSizeSelect
							v-model:page-size="pageSize"
							:page="page"
							:total="osReleasesPage?.total ?? 0"
						/>
					</template>

					<template #footer-right>
						<UPagination
							v-model:page="page"
							:total="osReleasesPage?.total ?? 0"
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
