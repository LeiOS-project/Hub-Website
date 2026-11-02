<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type {
	AdminListOrder,
	AdminPage,
	AdminStableRequest,
	AdminStableRequestStatus,
} from "~/utils/adminTypes";

definePageMeta({
	layout: "dashboard",
});

useSeoMeta({
	title: "Stable Promotion Requests | LeiOS Hub",
	description: "Review and manage stable promotion requests",
});

const toast = useToast();
const route = useRoute();
const router = useRouter();

const STATUS_ITEMS: { label: string; value: AdminStableRequestStatus | "all" }[] = [
	{ label: "Pending", value: "pending" },
	{ label: "Approved", value: "approved" },
	{ label: "Denied", value: "denied" },
	{ label: "All statuses", value: "all" },
];

const ORDER_ITEMS: { label: string; value: AdminListOrder }[] = [
	{ label: "Newest first", value: "newest" },
	{ label: "Oldest first", value: "oldest" },
];

// Initial filters come from the URL; without one the list shows the pending requests.
const filters = reactive({
	status: STATUS_ITEMS.find((i) => i.value === route.query.status)?.value ?? "pending",
	order: ORDER_ITEMS.find((i) => i.value === route.query.order)?.value ?? "newest",
});

const page = ref(1);
const pageSize = ref(25);

const {
	data: requestsPage,
	loading,
	refresh,
} = await useAPILazyAsyncData<AdminPage<AdminStableRequest>>(
	"admin-stable-promotion-requests-list",
	async () => {
		const res = await useAPI((api) =>
			api.getAdminStablePromotionRequests({
				query: {
					status: filters.status === "all" ? undefined : filters.status,
					order: filters.order,
					limit: pageSize.value,
					offset: (page.value - 1) * pageSize.value,
				},
			}),
		);

		if (!res.success) {
			toast.add({
				title: "Failed to load stable promotion requests",
				description: res.message,
				color: "error",
			});
			return { items: [], total: 0 };
		}

		// The page ran past the end (e.g. after deciding the last pending one): go back a page.
		if (res.data.items.length === 0 && res.data.total > 0 && page.value > 1) {
			page.value = Math.ceil(res.data.total / pageSize.value);
		}
		return res.data;
	},
);

function reloadFromFirstPage() {
	router.replace({
		query: {
			status: filters.status === "pending" ? undefined : filters.status,
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
watch(() => [filters.status, filters.order], reloadFromFirstPage);

const emptyTexts = computed(() =>
	filters.status === "pending"
		? { title: "Nothing to review", description: "No stable promotion requests are pending." }
		: { title: "No requests", description: "No stable promotion requests match this filter." },
);

const columns: TableColumn<AdminStableRequest>[] = [
	{ accessorKey: "id", header: "ID" },
	{ accessorKey: "package_fullname", header: "Package" },
	{ accessorKey: "package_release_version", header: "Release" },
	{ accessorKey: "status", header: "Status" },
	{ accessorKey: "created_at", header: "Requested" },
	{ accessorKey: "admin_note", header: "Admin Note" },
	{ id: "actions", header: "", enableSorting: false, enableHiding: false },
];

// Decision
const decisionModalOpen = ref(false);
const decisionTarget = ref<AdminStableRequest | null>(null);
const initialDecision = ref<"approved" | "denied">("approved");

function openDecision(request: AdminStableRequest, decision: "approved" | "denied") {
	decisionTarget.value = request;
	initialDecision.value = decision;
	decisionModalOpen.value = true;
}
</script>

<template>
	<UDashboardPanel>
		<template #header>
			<DashboardPageHeader
				title="Stable Promotion Requests"
				icon="i-lucide-git-pull-request"
				description="Review and manage stable promotion requests from developers"
			/>
		</template>

		<template #body>
			<DashboardPageBody>
				<DashboardDataTable
					:data="requestsPage?.items ?? []"
					:columns="columns"
					:loading="loading"
					:default-page-size="100"
					:empty-title="emptyTexts.title"
					:empty-description="emptyTexts.description"
					empty-icon="i-lucide-inbox"
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
							v-model="filters.order"
							:items="ORDER_ITEMS"
							class="w-full sm:w-auto sm:min-w-36"
						/>
					</template>

					<template #id-cell="{ row }">
						<NuxtLink
							:to="`/dashboard/admin/stable-promotion-requests/${row.original.id}`"
							class="font-mono text-sm text-primary-400 hover:underline"
						>
							#{{ row.original.id }}
						</NuxtLink>
					</template>

					<template #package_fullname-cell="{ row }">
						<NuxtLink
							:to="`/dashboard/packages/${row.original.package_fullname}`"
							class="font-medium text-white hover:underline"
						>
							{{ row.original.package_fullname }}
						</NuxtLink>
					</template>

					<template #package_release_version-cell="{ row }">
						<NuxtLink
							:to="`/dashboard/packages/${row.original.package_fullname}/releases/${row.original.package_release_version}`"
							class="font-mono text-sm text-slate-300 hover:text-primary-400 hover:underline"
						>
							{{ row.original.package_release_version }}
						</NuxtLink>
					</template>

					<template #status-cell="{ row }">
						<AdminStatusBadge :status="row.original.status" />
					</template>

					<template #created_at-cell="{ row }">
						<span class="whitespace-nowrap text-sm text-slate-400">
							{{ formatDate(row.original.created_at) }}
						</span>
					</template>

					<template #admin_note-cell="{ row }">
						<span v-if="row.original.admin_note" class="line-clamp-1 max-w-xs text-sm text-slate-400">
							{{ row.original.admin_note }}
						</span>
						<span v-else class="text-sm text-slate-500">—</span>
					</template>

					<template #actions-cell="{ row }">
						<div class="flex justify-end gap-1">
							<UTooltip v-if="row.original.status === 'pending'" text="Approve">
								<UButton
									icon="i-lucide-check"
									color="success"
									variant="soft"
									size="xs"
									aria-label="Approve"
									@click="openDecision(row.original, 'approved');"
								/>
							</UTooltip>
							<UTooltip v-if="row.original.status === 'pending'" text="Deny">
								<UButton
									icon="i-lucide-x"
									color="error"
									variant="soft"
									size="xs"
									aria-label="Deny"
									@click="openDecision(row.original, 'denied');"
								/>
							</UTooltip>
							<UTooltip text="Review details">
								<UButton
									:to="`/dashboard/admin/stable-promotion-requests/${row.original.id}`"
									icon="i-lucide-eye"
									color="neutral"
									variant="ghost"
									size="xs"
									aria-label="Review details"
								/>
							</UTooltip>
						</div>
					</template>

					<template #footer-left>
						<AdminPageSizeSelect
							v-model:page-size="pageSize"
							:page="page"
							:total="requestsPage?.total ?? 0"
						/>
					</template>

					<template #footer-right>
						<UPagination
							v-model:page="page"
							:total="requestsPage?.total ?? 0"
							:items-per-page="pageSize"
							:sibling-count="1"
							show-edges
						/>
					</template>
				</DashboardDataTable>
			</DashboardPageBody>
		</template>
	</UDashboardPanel>

	<AdminStableRequestDecisionModal
		v-model:open="decisionModalOpen"
		:request="decisionTarget"
		:initial-decision="initialDecision"
		@decided="refresh()"
	/>
</template>
