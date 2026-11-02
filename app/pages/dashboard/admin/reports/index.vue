<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type {
	AdminListOrder,
	AdminPage,
	AdminReport,
	AdminReportStatus,
	AdminReportTargetType,
} from "~/utils/adminTypes";

definePageMeta({
	layout: "dashboard",
});

useSeoMeta({
	title: "Reports | LeiOS Hub",
	description: "Review reported packages and publishers",
});

const toast = useToast();
const route = useRoute();
const router = useRouter();

const STATUS_ITEMS: { label: string; value: AdminReportStatus | "all" }[] = [
	{ label: "Open", value: "open" },
	{ label: "Resolved", value: "resolved" },
	{ label: "Dismissed", value: "dismissed" },
	{ label: "All statuses", value: "all" },
];

const TARGET_TYPE_ITEMS: { label: string; value: AdminReportTargetType | "all" }[] = [
	{ label: "Packages & publishers", value: "all" },
	{ label: "Packages", value: "package" },
	{ label: "Publishers", value: "publisher" },
];

const ORDER_ITEMS: { label: string; value: AdminListOrder }[] = [
	{ label: "Newest first", value: "newest" },
	{ label: "Oldest first", value: "oldest" },
];

// Initial filters come from the URL; without one the list shows the open reports.
const filters = reactive({
	status: STATUS_ITEMS.find((i) => i.value === route.query.status)?.value ?? "open",
	targetType: TARGET_TYPE_ITEMS.find((i) => i.value === route.query.target_type)?.value ?? "all",
	order: ORDER_ITEMS.find((i) => i.value === route.query.order)?.value ?? "newest",
});

const page = ref(1);
const pageSize = ref(25);

const {
	data: reportsPage,
	loading,
	refresh,
} = await useAPILazyAsyncData<AdminPage<AdminReport>>("admin-reports-list", async () => {
	const res = await useAPI((api) =>
		api.getAdminReports({
			query: {
				status: filters.status === "all" ? undefined : filters.status,
				target_type: filters.targetType === "all" ? undefined : filters.targetType,
				order: filters.order,
				limit: pageSize.value,
				offset: (page.value - 1) * pageSize.value,
			},
		}),
	);

	if (!res.success) {
		toast.add({ title: "Failed to load reports", description: res.message, color: "error" });
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
			status: filters.status === "open" ? undefined : filters.status,
			target_type: filters.targetType === "all" ? undefined : filters.targetType,
			order: filters.order === "newest" ? undefined : filters.order,
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
watch(() => [filters.status, filters.targetType, filters.order], reloadFromFirstPage);

const emptyTexts = computed(() => {
	if (filters.status === "open" && filters.targetType === "all") {
		return { title: "No open reports", description: "Nothing needs a look right now." };
	}
	return { title: "No reports", description: "No reports match these filters." };
});

const columns: TableColumn<AdminReport>[] = [
	{ accessorKey: "id", header: "ID" },
	{ id: "target", header: "Reported" },
	{ accessorKey: "reason", header: "Reason" },
	{ accessorKey: "reporter_username", header: "Reporter" },
	{ accessorKey: "status", header: "Status" },
	{ accessorKey: "created_at", header: "Filed" },
	{ id: "actions", header: "", enableSorting: false, enableHiding: false },
];
</script>

<template>
	<UDashboardPanel>
		<template #header>
			<DashboardPageHeader
				title="Reports"
				icon="i-lucide-flag"
				description="Review reported packages and publishers"
			/>
		</template>

		<template #body>
			<DashboardPageBody>
				<DashboardDataTable
					:data="reportsPage?.items ?? []"
					:columns="columns"
					:loading="loading"
					:default-page-size="100"
					:empty-title="emptyTexts.title"
					:empty-description="emptyTexts.description"
					empty-icon="i-lucide-flag"
					@refresh="refresh()"
				>
					<template #header-left>
						<USelect
							v-model="filters.status"
							:items="STATUS_ITEMS"
							icon="i-lucide-filter"
							class="w-full sm:w-auto sm:min-w-40"
						/>
						<USelect
							v-model="filters.targetType"
							:items="TARGET_TYPE_ITEMS"
							class="w-full sm:w-auto sm:min-w-52"
						/>
						<USelect
							v-model="filters.order"
							:items="ORDER_ITEMS"
							class="w-full sm:w-auto sm:min-w-36"
						/>
					</template>

					<template #id-cell="{ row }">
						<NuxtLink
							:to="`/dashboard/admin/reports/${row.original.id}`"
							class="font-mono text-sm text-primary-400 hover:underline"
						>
							#{{ row.original.id }}
						</NuxtLink>
					</template>

					<template #target-cell="{ row }">
						<div class="flex min-w-0 items-center gap-2">
							<UIcon
								:name="row.original.target_type === 'package' ? 'i-lucide-package' : 'i-lucide-building-2'"
								class="size-4 shrink-0 text-slate-400"
							/>
							<div class="min-w-0">
								<p class="truncate font-medium text-white">{{ row.original.target_label }}</p>
								<p class="text-xs capitalize text-slate-500">{{ row.original.target_type }}</p>
							</div>
						</div>
					</template>

					<template #reason-cell="{ row }">
						<div class="flex max-w-xs flex-col items-start gap-1">
							<AdminReportReasonBadge :reason="row.original.reason" size="sm" />
							<p v-if="row.original.details" class="line-clamp-1 text-xs text-slate-400">
								{{ row.original.details }}
							</p>
						</div>
					</template>

					<template #reporter_username-cell="{ row }">
						<NuxtLink
							v-if="row.original.reporter_user_id"
							:to="`/dashboard/admin/users/${row.original.reporter_user_id}`"
							class="text-primary-400 hover:underline"
						>
							{{ row.original.reporter_username ?? `#${row.original.reporter_user_id}` }}
						</NuxtLink>
						<span v-else class="text-sm text-slate-500">Deleted user</span>
					</template>

					<template #status-cell="{ row }">
						<AdminStatusBadge :status="row.original.status" />
					</template>

					<template #created_at-cell="{ row }">
						<span class="whitespace-nowrap text-sm text-slate-400">
							{{ formatDate(row.original.created_at) }}
						</span>
					</template>

					<template #actions-cell="{ row }">
						<div class="flex justify-end">
							<UButton
								:to="`/dashboard/admin/reports/${row.original.id}`"
								:label="row.original.status === 'open' ? 'Review' : 'View'"
								:icon="row.original.status === 'open' ? 'i-lucide-gavel' : 'i-lucide-eye'"
								:color="row.original.status === 'open' ? 'primary' : 'neutral'"
								variant="soft"
								size="xs"
							/>
						</div>
					</template>

					<template #footer-left>
						<AdminPageSizeSelect
							v-model:page-size="pageSize"
							:page="page"
							:total="reportsPage?.total ?? 0"
						/>
					</template>

					<template #footer-right>
						<UPagination
							v-model:page="page"
							:total="reportsPage?.total ?? 0"
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
