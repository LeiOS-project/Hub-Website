<script setup lang="ts">
import type { AdminReport, AdminStableRequest, AdminStats, AdminTask } from "~/utils/adminTypes";

definePageMeta({
	layout: "dashboard",
});

useSeoMeta({
	title: "Admin Overview | LeiOS Hub",
	description: "Moderation work queues and site statistics",
});

const toast = useToast();

const QUEUE_SIZE = 5;

const {
	data: stats,
	loading: statsLoading,
	refresh: refreshStats,
} = await useAPILazyAsyncData<AdminStats | null>("admin-overview-stats", async () => {
	const res = await useAPI((api) => api.getAdminStats({}));
	if (!res.success) {
		toast.add({ title: "Failed to load statistics", description: res.message, color: "error" });
		return null;
	}
	return res.data;
});

const {
	data: pendingRequests,
	loading: pendingRequestsLoading,
	refresh: refreshPendingRequests,
} = await useAPILazyAsyncData<AdminStableRequest[]>("admin-overview-stable-requests", async () => {
	const res = await useAPI((api) =>
		api.getAdminStablePromotionRequests({
			query: { status: "pending", order: "oldest", limit: QUEUE_SIZE },
		}),
	);
	return res.success ? res.data.items : [];
});

const {
	data: openReports,
	loading: openReportsLoading,
	refresh: refreshOpenReports,
} = await useAPILazyAsyncData<AdminReport[]>("admin-overview-reports", async () => {
	const res = await useAPI((api) =>
		api.getAdminReports({ query: { status: "open", order: "oldest", limit: QUEUE_SIZE } }),
	);
	return res.success ? res.data.items : [];
});

const {
	data: failedTasks,
	loading: failedTasksLoading,
	refresh: refreshFailedTasks,
} = await useAPILazyAsyncData<AdminTask[]>("admin-overview-failed-tasks", async () => {
	const res = await useAPI((api) =>
		api.getAdminTasks({ query: { status: "failed", order: "newest", limit: QUEUE_SIZE } }),
	);
	return res.success ? res.data.items : [];
});

const auditLogTable = useTemplateRef<{ refresh: () => Promise<void> }>("auditLogTable");

const refreshing = ref(false);
async function refreshAll() {
	refreshing.value = true;
	await Promise.all([
		refreshStats(),
		refreshPendingRequests(),
		refreshOpenReports(),
		refreshFailedTasks(),
		auditLogTable.value?.refresh(),
	]);
	refreshing.value = false;
}

type StatTile = {
	label: string;
	value: number;
	hint?: string;
	icon: string;
	iconColor: "primary" | "amber" | "emerald" | "error" | "neutral";
	to: string;
};

const statTiles = computed<StatTile[]>(() => {
	const s = stats.value;
	return [
		{
			label: "Users",
			value: s?.users.total ?? 0,
			hint: s
				? `${s.users.new_last_7_days} new this week · ${s.users.suspended} suspended · ${s.users.unverified} unconfirmed`
				: undefined,
			icon: "i-lucide-users",
			iconColor: "primary",
			to: "/dashboard/admin/users",
		},
		{
			label: "Publishers",
			value: s?.publishers.total ?? 0,
			hint: s ? `${s.publishers.verified} verified` : undefined,
			icon: "i-lucide-building-2",
			iconColor: "primary",
			to: "/dashboard/admin/publishers",
		},
		{
			label: "Packages",
			value: s?.packages.total ?? 0,
			hint: s ? `${s.packages.hidden} hidden · ${s.packages.deprecated} deprecated` : undefined,
			icon: "i-lucide-package",
			iconColor: "primary",
			to: "/dashboard/admin/packages",
		},
		{
			label: "Releases",
			value: s?.releases ?? 0,
			icon: "i-lucide-tag",
			iconColor: "neutral",
			to: "/dashboard/admin/packages",
		},
		{
			label: "Pending Stable Requests",
			value: s?.stable_promotion_requests_pending ?? 0,
			icon: "i-lucide-git-pull-request",
			iconColor: s?.stable_promotion_requests_pending ? "amber" : "emerald",
			to: "/dashboard/admin/stable-promotion-requests",
		},
		{
			label: "Open Reports",
			value: s?.reports_open ?? 0,
			icon: "i-lucide-flag",
			iconColor: s?.reports_open ? "error" : "emerald",
			to: "/dashboard/admin/reports",
		},
		{
			label: "Running Tasks",
			value: s?.tasks.running ?? 0,
			hint: s ? `${s.tasks.pending} pending` : undefined,
			icon: "i-lucide-loader",
			iconColor: "primary",
			to: "/dashboard/admin/tasks?status=running",
		},
		{
			label: "Failed Tasks",
			value: s?.tasks.failed ?? 0,
			icon: "i-lucide-circle-x",
			iconColor: s?.tasks.failed ? "error" : "emerald",
			to: "/dashboard/admin/tasks?status=failed",
		},
	];
});

function formatAgo(ts: number) {
	const seconds = Math.max(0, Math.floor((Date.now() - ts) / 1000));
	return seconds < 60 ? "just now" : `${formatDuration(seconds)} ago`;
}
</script>

<template>
	<UDashboardPanel>
		<template #header>
			<DashboardPageHeader
				title="Admin Overview"
				icon="i-lucide-gauge"
				description="Work queues and site statistics"
			>
				<template #right>
					<UButton
						label="Refresh"
						icon="i-lucide-refresh-cw"
						color="neutral"
						variant="subtle"
						:loading="refreshing"
						@click="refreshAll();"
					/>
				</template>
			</DashboardPageHeader>
		</template>

		<template #body>
			<DashboardPageBody>
				<!-- Statistics -->
				<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<NuxtLink
						v-for="tile in statTiles"
						:key="tile.label"
						:to="tile.to"
						class="block rounded-lg transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-primary-400"
					>
						<DashboardStatCard
							:label="tile.label"
							:value="tile.value"
							:hint="tile.hint"
							:icon="tile.icon"
							:icon-color="tile.iconColor"
							:loading="statsLoading && !stats"
							class="h-full hover:border-primary-400/50"
						/>
					</NuxtLink>
				</div>

				<!-- Work queues -->
				<div class="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
					<DashboardSectionCard
						title="Stable Promotion Requests"
						description="Pending, waiting the longest first"
						icon="i-lucide-git-pull-request"
						flush
					>
						<template #actions>
							<UButton
								label="View all"
								trailing-icon="i-lucide-arrow-right"
								color="neutral"
								variant="ghost"
								size="sm"
								to="/dashboard/admin/stable-promotion-requests"
							/>
						</template>

						<div v-if="pendingRequestsLoading && !pendingRequests" class="flex justify-center py-8">
							<UIcon name="i-lucide-loader-2" class="animate-spin text-2xl text-slate-400" />
						</div>
						<UEmpty
							v-else-if="!pendingRequests?.length"
							icon="i-lucide-circle-check"
							title="Nothing to review"
							description="No stable promotion requests are pending."
							variant="naked"
							size="sm"
						/>
						<ul v-else class="divide-y divide-slate-800">
							<li v-for="request in pendingRequests" :key="request.id">
								<NuxtLink
									:to="`/dashboard/admin/stable-promotion-requests/${request.id}`"
									class="flex items-center justify-between gap-3 px-6 py-3 transition-colors hover:bg-slate-800/40"
								>
									<div class="min-w-0">
										<p class="truncate font-medium text-white">{{ request.package_fullname }}</p>
										<p class="truncate font-mono text-xs text-slate-400">
											{{ request.package_release_version }}
										</p>
									</div>
									<span class="shrink-0 text-xs text-slate-500">
										{{ formatAgo(request.created_at) }}
									</span>
								</NuxtLink>
							</li>
						</ul>
					</DashboardSectionCard>

					<DashboardSectionCard
						title="Open Reports"
						description="Waiting the longest first"
						icon="i-lucide-flag"
						flush
					>
						<template #actions>
							<UButton
								label="View all"
								trailing-icon="i-lucide-arrow-right"
								color="neutral"
								variant="ghost"
								size="sm"
								to="/dashboard/admin/reports"
							/>
						</template>

						<div v-if="openReportsLoading && !openReports" class="flex justify-center py-8">
							<UIcon name="i-lucide-loader-2" class="animate-spin text-2xl text-slate-400" />
						</div>
						<UEmpty
							v-else-if="!openReports?.length"
							icon="i-lucide-circle-check"
							title="No open reports"
							description="Nothing has been reported that needs a look."
							variant="naked"
							size="sm"
						/>
						<ul v-else class="divide-y divide-slate-800">
							<li v-for="report in openReports" :key="report.id">
								<NuxtLink
									:to="`/dashboard/admin/reports/${report.id}`"
									class="flex items-center justify-between gap-3 px-6 py-3 transition-colors hover:bg-slate-800/40"
								>
									<div class="flex min-w-0 items-center gap-3">
										<UIcon
											:name="report.target_type === 'package' ? 'i-lucide-package' : 'i-lucide-building-2'"
											class="size-4 shrink-0 text-slate-400"
										/>
										<div class="min-w-0">
											<p class="truncate font-medium text-white">{{ report.target_label }}</p>
											<p class="truncate text-xs text-slate-400">
												by {{ report.reporter_username ?? "deleted user" }}
											</p>
										</div>
									</div>
									<div class="flex shrink-0 flex-col items-end gap-1">
										<AdminReportReasonBadge :reason="report.reason" size="sm" />
										<span class="text-xs text-slate-500">{{ formatAgo(report.created_at) }}</span>
									</div>
								</NuxtLink>
							</li>
						</ul>
					</DashboardSectionCard>

					<DashboardSectionCard
						title="Failed Tasks"
						description="Most recent first"
						icon="i-lucide-circle-x"
						flush
					>
						<template #actions>
							<UButton
								label="View all"
								trailing-icon="i-lucide-arrow-right"
								color="neutral"
								variant="ghost"
								size="sm"
								to="/dashboard/admin/tasks?status=failed"
							/>
						</template>

						<div v-if="failedTasksLoading && !failedTasks" class="flex justify-center py-8">
							<UIcon name="i-lucide-loader-2" class="animate-spin text-2xl text-slate-400" />
						</div>
						<UEmpty
							v-else-if="!failedTasks?.length"
							icon="i-lucide-circle-check"
							title="No failed tasks"
							description="All background tasks finished without errors."
							variant="naked"
							size="sm"
						/>
						<ul v-else class="divide-y divide-slate-800">
							<li v-for="task in failedTasks" :key="task.id">
								<NuxtLink
									:to="`/dashboard/admin/tasks/${task.id}`"
									class="flex items-center justify-between gap-3 px-6 py-3 transition-colors hover:bg-slate-800/40"
								>
									<div class="min-w-0">
										<p class="font-mono text-sm text-white">#{{ task.id }}</p>
										<p class="truncate text-xs text-slate-400">{{ task.message || "No message" }}</p>
									</div>
									<span class="shrink-0 text-xs text-slate-500">
										{{ formatAgo(task.finished_at ?? task.created_at) }}
									</span>
								</NuxtLink>
							</li>
						</ul>
					</DashboardSectionCard>
				</div>

				<!-- Latest activity -->
				<AdminAuditLogTable
					ref="auditLogTable"
					title="Latest Activity"
					description="The most recent audit-log entries"
					:default-page-size="QUEUE_SIZE"
					:paginated="false"
					empty-description="No actions have been recorded yet."
				>
					<template #actions>
						<UButton
							label="View all"
							trailing-icon="i-lucide-arrow-right"
							color="neutral"
							variant="ghost"
							size="sm"
							to="/dashboard/admin/audit-log"
						/>
					</template>
				</AdminAuditLogTable>
			</DashboardPageBody>
		</template>
	</UDashboardPanel>
</template>
