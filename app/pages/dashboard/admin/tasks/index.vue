<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { watchDebounced } from "@vueuse/core";
import type { AdminListOrder, AdminPage, AdminTask, AdminTaskStatus } from "~/utils/adminTypes";

definePageMeta({
	layout: "dashboard",
});

useSeoMeta({
	title: "Tasks | LeiOS Hub",
	description: "View scheduled tasks",
});

const toast = useToast();
const route = useRoute();
const router = useRouter();

/** The API searches from 3 characters on. */
const MIN_SEARCH_LENGTH = 3;

const STATUS_ITEMS: { label: string; value: AdminTaskStatus | "all" }[] = [
	{ label: "All statuses", value: "all" },
	{ label: "Pending", value: "pending" },
	{ label: "Running", value: "running" },
	{ label: "Paused", value: "paused" },
	{ label: "Completed", value: "completed" },
	{ label: "Failed", value: "failed" },
];

const ORDER_ITEMS: { label: string; value: AdminListOrder }[] = [
	{ label: "Newest first", value: "newest" },
	{ label: "Oldest first", value: "oldest" },
];

// Initial filters come from the URL so filtered views (e.g. failed tasks) can be linked.
const filters = reactive({
	status: STATUS_ITEMS.find((i) => i.value === route.query.status)?.value ?? "all",
	search: typeof route.query.search === "string" ? route.query.search : "",
	order: ORDER_ITEMS.find((i) => i.value === route.query.order)?.value ?? "newest",
});

const effectiveSearch = computed(() => {
	const search = filters.search.trim();
	return search.length >= MIN_SEARCH_LENGTH ? search : "";
});
const searchTooShort = computed(() => {
	const length = filters.search.trim().length;
	return length > 0 && length < MIN_SEARCH_LENGTH;
});

const page = ref(1);
const pageSize = ref(25);

const {
	data: tasksPage,
	loading,
	refresh,
} = await useAPILazyAsyncData<AdminPage<AdminTask>>("admin-tasks-list", async () => {
	const res = await useAPI((api) =>
		api.getAdminTasks({
			query: {
				status: filters.status === "all" ? undefined : filters.status,
				searchString: effectiveSearch.value || undefined,
				order: filters.order,
				limit: pageSize.value,
				offset: (page.value - 1) * pageSize.value,
			},
		}),
	);

	if (!res.success) {
		toast.add({ title: "Failed to load tasks", description: res.message, color: "error" });
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
			status: filters.status === "all" ? undefined : filters.status,
			search: effectiveSearch.value || undefined,
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
// Only reload when the effective search changes (typing the first two characters does nothing).
watchDebounced(effectiveSearch, reloadFromFirstPage, { debounce: 300 });

const hasActiveFilters = computed(
	() => filters.status !== "all" || filters.search.trim() !== "" || filters.order !== "newest",
);

function resetFilters() {
	filters.status = "all";
	filters.search = "";
	filters.order = "newest";
}

const columns: TableColumn<AdminTask>[] = [
	{ accessorKey: "id", header: "ID" },
	{ accessorKey: "status", header: "Status" },
	{ accessorKey: "message", header: "Message" },
	{ accessorKey: "created_at", header: "Created" },
	{ accessorKey: "finished_at", header: "Finished" },
	{ id: "duration", header: "Duration" },
	{ id: "actions", header: "", enableSorting: false, enableHiding: false },
];

function duration(task: AdminTask) {
	if (!task.finished_at) return "—";
	return formatDuration(Math.max(0, Math.round((task.finished_at - task.created_at) / 1000)));
}
</script>

<template>
	<UDashboardPanel>
		<template #header>
			<DashboardPageHeader
				title="Tasks"
				icon="i-lucide-list-checks"
				description="View scheduled tasks"
			/>
		</template>

		<template #body>
			<DashboardPageBody>
				<DashboardDataTable
					:data="tasksPage?.items ?? []"
					:columns="columns"
					:loading="loading"
					:default-page-size="100"
					:empty-title="hasActiveFilters ? 'No matching tasks' : 'No tasks'"
					:empty-description="
						hasActiveFilters
							? 'Try other filters.'
							: 'Tasks appear here when releases are uploaded or OS releases are published.'
					"
					empty-icon="i-lucide-clipboard-list"
					@refresh="refresh()"
				>
					<template #header-left>
						<USelect
							v-model="filters.status"
							:items="STATUS_ITEMS"
							icon="i-lucide-filter"
							class="w-full sm:w-auto sm:min-w-40"
						/>
						<UInput
							v-model="filters.search"
							icon="i-lucide-search"
							placeholder="Search task type or message..."
							:color="searchTooShort ? 'warning' : 'primary'"
							:highlight="searchTooShort"
							class="w-full sm:w-auto sm:min-w-64"
						/>
						<span v-if="searchTooShort" class="text-xs text-amber-400">
							Type at least {{ MIN_SEARCH_LENGTH }} characters
						</span>
						<USelect
							v-model="filters.order"
							:items="ORDER_ITEMS"
							class="w-full sm:w-auto sm:min-w-36"
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

					<template #id-cell="{ row }">
						<NuxtLink
							:to="`/dashboard/admin/tasks/${row.original.id}`"
							class="font-mono text-sm text-primary-400 hover:underline"
						>
							#{{ row.original.id }}
						</NuxtLink>
					</template>

					<template #status-cell="{ row }">
						<AdminStatusBadge :status="row.original.status" />
					</template>

					<template #message-cell="{ row }">
						<span class="line-clamp-1 max-w-md text-slate-400">
							{{ row.original.message || "—" }}
						</span>
					</template>

					<template #created_at-cell="{ row }">
						<span class="whitespace-nowrap text-sm text-slate-400">
							{{ formatDate(row.original.created_at) }}
						</span>
					</template>

					<template #finished_at-cell="{ row }">
						<span class="whitespace-nowrap text-sm text-slate-400">
							{{ formatDate(row.original.finished_at) }}
						</span>
					</template>

					<template #duration-cell="{ row }">
						<span class="font-mono text-sm text-slate-400">{{ duration(row.original) }}</span>
					</template>

					<template #actions-cell="{ row }">
						<div class="flex items-center justify-end gap-1">
							<UTooltip v-if="row.original.storeLogs" text="Has logs">
								<UIcon name="i-lucide-file-text" class="size-4 text-slate-500" />
							</UTooltip>
							<UButton
								:to="`/dashboard/admin/tasks/${row.original.id}`"
								icon="i-lucide-eye"
								color="neutral"
								variant="ghost"
								size="xs"
								aria-label="Open task"
							/>
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
							:total="tasksPage?.total ?? 0"
						/>
					</template>

					<template #footer-right>
						<UPagination
							v-model:page="page"
							:total="tasksPage?.total ?? 0"
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
