<script setup lang="ts">
/**
 * Stable promotion requests for reviewers (admins and moderators): filter by status, search by
 * package or version, queue / deny / reopen requests. `?status=queued` is the stable queue.
 */
import type { TableColumn } from "@nuxt/ui";
import { watchDebounced } from "@vueuse/core";
import { useUserInfoStore } from "~/composables/stores/useUserStore";
import type { AdminListOrder, AdminPage, AdminStableRequest } from "~/utils/adminTypes";
import { STABLE_STATUS_FILTER_ITEMS, type StablePromotionStatus } from "~/utils/stablePromotion";

definePageMeta({
	layout: "dashboard",
});

useSeoMeta({
	title: "Stable Promotion Requests | LeiOS Hub",
	description: "Review stable promotion requests and the stable queue",
});

const toast = useToast();
const route = useRoute();
const router = useRouter();
const user = await useUserInfoStore().use();
const isAdmin = computed(() => user.value?.role === "admin");

const ORDER_ITEMS: { label: string; value: AdminListOrder }[] = [
	{ label: "Newest first", value: "newest" },
	{ label: "Oldest first", value: "oldest" },
];

// Initial filters come from the URL; without one the list shows the requests awaiting review.
const filters = reactive({
	status: STABLE_STATUS_FILTER_ITEMS.find((i) => i.value === route.query.status)?.value ?? "pending",
	order: ORDER_ITEMS.find((i) => i.value === route.query.order)?.value ?? "newest",
	search: typeof route.query.search === "string" ? route.query.search : "",
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
					search: filters.search.trim() || undefined,
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
			search: filters.search.trim() || undefined,
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
watchDebounced(() => filters.search, reloadFromFirstPage, { debounce: 300 });

const EMPTY_TEXTS: Partial<
	Record<StablePromotionStatus | "all", { title: string; description: string }>
> = {
	pending: { title: "Nothing to review", description: "No stable promotion requests await review." },
	queued: {
		title: "The stable queue is empty",
		description: "Queue a reviewed request to include it in the next OS release.",
	},
};
const emptyTexts = computed(
	() =>
		(!filters.search.trim() && EMPTY_TEXTS[filters.status]) || {
			title: "No requests",
			description: "No stable promotion requests match these filters.",
		},
);

const columns: TableColumn<AdminStableRequest>[] = [
	{ accessorKey: "id", header: "ID" },
	{ accessorKey: "package_fullname", header: "Package" },
	{ accessorKey: "package_release_version", header: "Release" },
	{ accessorKey: "status", header: "Status" },
	{ accessorKey: "requested_by_username", header: "Requested by" },
	{ accessorKey: "comment_count", header: "Conversation" },
	{ accessorKey: "created_at", header: "Requested" },
	{ id: "actions", header: "", enableSorting: false, enableHiding: false },
];

function architectures(request: AdminStableRequest) {
	const archs = request.package_release_architectures;
	if (archs.is_all) return ["all"];
	return (["amd64", "arm64"] as const).filter((arch) => archs[arch]);
}

// Status changes
const statusModalOpen = ref(false);
const statusTarget = ref<AdminStableRequest | null>(null);
const initialStatus = ref<"pending" | "queued" | "denied">("queued");

function openStatusChange(request: AdminStableRequest, status: "pending" | "queued" | "denied") {
	statusTarget.value = request;
	initialStatus.value = status;
	statusModalOpen.value = true;
}
</script>

<template>
	<UDashboardPanel>
		<template #header>
			<DashboardPageHeader
				title="Stable Promotion Requests"
				icon="i-lucide-git-pull-request"
				description="Review requests to move releases into stable; queued releases wait for the next OS release"
			>
				<template #right>
					<UButton
						v-if="isAdmin"
						to="/dashboard/admin/os-releases/new"
						icon="i-lucide-rocket"
						label="New OS release"
						color="neutral"
						variant="outline"
					/>
				</template>
			</DashboardPageHeader>
		</template>

		<template #body>
			<DashboardPageBody>
				<UAlert
					v-if="filters.status === 'queued' && (requestsPage?.total ?? 0) > 0"
					color="info"
					variant="subtle"
					icon="i-lucide-list-ordered"
					:title="`${requestsPage?.total} ${requestsPage?.total === 1 ? 'release is' : 'releases are'} queued for stable`"
					:description="
						isAdmin
							? 'Create an OS release to move them into stable. You choose which ones it includes.'
							: 'An administrator includes them in the next OS release.'
					"
					:actions="
						isAdmin
							? [
									{
										label: 'Create OS release',
										icon: 'i-lucide-rocket',
										to: '/dashboard/admin/os-releases/new',
									},
								]
							: undefined
					"
				/>

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
						<UInput
							v-model="filters.search"
							icon="i-lucide-search"
							placeholder="Search package or version…"
							class="w-full sm:w-64"
						/>
						<USelect
							v-model="filters.status"
							:items="STABLE_STATUS_FILTER_ITEMS"
							icon="i-lucide-filter"
							class="w-full sm:w-auto sm:min-w-44"
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
						<div class="min-w-0">
							<NuxtLink
								:to="`/explore/${row.original.package_fullname}`"
								class="block font-medium text-white hover:underline"
							>
								{{ row.original.package_display_name }}
							</NuxtLink>
							<span class="font-mono text-xs text-slate-500">{{ row.original.package_fullname }}</span>
						</div>
					</template>

					<template #package_release_version-cell="{ row }">
						<div class="space-y-1">
							<span class="font-mono text-sm text-slate-300">
								{{ row.original.package_release_version }}
							</span>
							<div class="flex flex-wrap gap-1">
								<UBadge
									v-for="arch in architectures(row.original)"
									:key="arch"
									color="neutral"
									variant="outline"
									size="xs"
								>
									{{ arch }}
								</UBadge>
							</div>
						</div>
					</template>

					<template #status-cell="{ row }">
						<HubStableStatusBadge
							:status="row.original.status"
							:os-release-version="row.original.os_release_version"
						/>
					</template>

					<template #requested_by_username-cell="{ row }">
						<span class="text-sm text-slate-300">
							{{ row.original.requested_by_username ? `@${row.original.requested_by_username}` : "—" }}
						</span>
					</template>

					<template #comment_count-cell="{ row }">
						<span class="flex items-center gap-1.5 text-sm text-slate-400">
							<UIcon name="i-lucide-message-square" class="size-4" />
							{{ row.original.comment_count }}
							<span v-if="row.original.last_message_at" class="text-xs text-slate-500">
								· {{ formatDate(row.original.last_message_at) }}
							</span>
						</span>
					</template>

					<template #created_at-cell="{ row }">
						<span class="whitespace-nowrap text-sm text-slate-400">
							{{ formatDate(row.original.created_at) }}
						</span>
					</template>

					<template #actions-cell="{ row }">
						<div class="flex justify-end gap-1">
							<UTooltip v-if="row.original.status === 'pending' || row.original.status === 'denied'" text="Queue for stable">
								<UButton
									icon="i-lucide-list-plus"
									color="info"
									variant="soft"
									size="xs"
									aria-label="Queue for stable"
									@click="openStatusChange(row.original, 'queued')"
								/>
							</UTooltip>
							<UTooltip v-if="row.original.status === 'queued'" text="Take out of the queue">
								<UButton
									icon="i-lucide-list-minus"
									color="warning"
									variant="soft"
									size="xs"
									aria-label="Take out of the queue"
									@click="openStatusChange(row.original, 'pending')"
								/>
							</UTooltip>
							<UTooltip v-if="row.original.status === 'pending' || row.original.status === 'queued'" text="Deny">
								<UButton
									icon="i-lucide-x"
									color="error"
									variant="soft"
									size="xs"
									aria-label="Deny"
									@click="openStatusChange(row.original, 'denied')"
								/>
							</UTooltip>
							<UTooltip text="Open the request">
								<UButton
									:to="`/dashboard/admin/stable-promotion-requests/${row.original.id}`"
									icon="i-lucide-message-square-text"
									color="neutral"
									variant="ghost"
									size="xs"
									aria-label="Open the request"
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

	<AdminStableRequestStatusModal
		v-model:open="statusModalOpen"
		:request="statusTarget"
		:initial-status="initialStatus"
		@changed="refresh()"
	/>
</template>
