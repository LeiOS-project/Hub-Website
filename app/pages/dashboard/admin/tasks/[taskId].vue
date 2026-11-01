<script setup lang="ts">
import type { BreadcrumbItem } from "@nuxt/ui";
import { useIntervalFn } from "@vueuse/core";
import type { AdminTask } from "~/utils/adminTypes";

definePageMeta({
	layout: "dashboard",
});

const route = useRoute();

const taskId = Number(route.params.taskId);
if (!Number.isInteger(taskId) || taskId <= 0) {
	throw createError({ statusCode: 404, statusMessage: "Task not found" });
}

/** How often a pending or running task (and its log) is reloaded. */
const POLL_INTERVAL_MS = 5000;

useSeoMeta({
	title: `Task #${taskId} | Tasks | LeiOS Hub`,
	description: `Status and logs of task #${taskId}`,
});

const breadcrumbItems: BreadcrumbItem[] = [
	{ label: "Tasks", to: "/dashboard/admin/tasks" },
	{ label: `#${taskId}` },
];

const {
	data: result,
	refresh: refreshTask,
	loading: taskLoading,
} = await useAPIAsyncData(
	`admin-task:${taskId}`,
	async () => await useAPI((api) => api.getAdminTasksByTaskId({ path: { taskID: taskId } })),
);

const task = computed<AdminTask | null>(() => (result.value?.success ? result.value.data : null));

const error = computed(() => {
	const res = result.value;
	if (!res || res.success) return null;
	return createError({
		statusCode: res.code || 500,
		statusMessage: res.message || "Failed to load the task",
	});
});

const {
	data: logsResult,
	refresh: refreshLogs,
	loading: logsLoading,
} = await useAPILazyAsyncData(`admin-task:${taskId}:logs`, async () => {
	if (!task.value?.storeLogs) return null;
	return await useAPI((api) => api.getAdminTasksByTaskIdLogs({ path: { taskID: taskId } }));
});

const logs = computed(() => (logsResult.value?.success ? logsResult.value.data.logs : null));

// 404 = no log file yet (the task has not started writing): show the empty state, not an error.
const logsError = computed(() => {
	const res = logsResult.value;
	if (!res || res.success || (res.code as number) === 404) return null;
	return res.message || "An error occurred while fetching the logs.";
});

const isActive = computed(
	() => task.value?.status === "pending" || task.value?.status === "running",
);

async function refreshAll() {
	await refreshTask();
	if (task.value?.storeLogs) await refreshLogs();
}

const { pause, resume } = useIntervalFn(refreshAll, POLL_INTERVAL_MS, { immediate: false });

watch(
	isActive,
	(active, wasActive) => {
		if (active) {
			resume();
		} else {
			pause();
			// Load the final log once the task has finished.
			if (wasActive && task.value?.storeLogs) refreshLogs();
		}
	},
	{ immediate: true },
);

const resultText = computed(() => {
	const value = task.value?.result;
	if (value === null || value === undefined) return null;
	return typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
});

const duration = computed(() => {
	const t = task.value;
	if (!t?.finished_at) return null;
	return formatDuration(Math.max(0, Math.round((t.finished_at - t.created_at) / 1000)));
});
</script>

<template>
	<UDashboardPanel>
		<template #header>
			<DashboardPageHeader icon="i-lucide-list-checks" :breadcrumb-items="breadcrumbItems">
				<template #right>
					<span v-if="isActive" class="hidden items-center gap-1.5 text-xs text-slate-400 sm:flex">
						<span class="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></span>
						Updating every {{ POLL_INTERVAL_MS / 1000 }}s
					</span>
					<UButton
						icon="i-lucide-refresh-cw"
						color="neutral"
						variant="subtle"
						aria-label="Refresh"
						:loading="taskLoading"
						@click="refreshAll();"
					/>
				</template>
			</DashboardPageHeader>
		</template>

		<template #body>
			<UError v-if="error" :error="error" />

			<DashboardPageBody v-else-if="task">
				<div class="grid gap-6 lg:grid-cols-3">
					<DashboardSectionCard
						:title="`Task #${task.id}`"
						description="Status and timing"
						icon="i-lucide-list-checks"
					>
						<div class="divide-y divide-slate-800">
							<AdminDetailRow label="Status">
								<AdminStatusBadge :status="task.status" />
							</AdminDetailRow>
							<AdminDetailRow label="Created">
								{{ formatDate(task.created_at) }}
							</AdminDetailRow>
							<AdminDetailRow label="Finished">
								{{ formatDate(task.finished_at) }}
							</AdminDetailRow>
							<AdminDetailRow label="Duration" description="Since it was queued">
								<span class="font-mono">{{ duration ?? "—" }}</span>
							</AdminDetailRow>
							<AdminDetailRow label="Logs">
								{{ task.storeLogs ? "Stored" : "Not stored" }}
							</AdminDetailRow>
						</div>
					</DashboardSectionCard>

					<DashboardSectionCard
						title="Outcome"
						description="Message and result reported by the task"
						icon="i-lucide-message-square-text"
						class="lg:col-span-2"
					>
						<div class="space-y-4">
							<div>
								<p class="mb-2 text-sm font-medium text-slate-300">Message</p>
								<div
									:class="[
										'rounded-lg border p-4',
										task.status === 'failed'
											? 'border-red-900/50 bg-red-950/30'
											: 'border-slate-800 bg-slate-950/40',
									]"
								>
									<p
										v-if="task.message"
										:class="[
											'whitespace-pre-wrap break-words text-sm',
											task.status === 'failed' ? 'text-red-300' : 'text-slate-200',
										]"
									>
										{{ task.message }}
									</p>
									<p v-else class="text-sm italic text-slate-500">No message.</p>
								</div>
							</div>

							<div>
								<p class="mb-2 text-sm font-medium text-slate-300">Result</p>
								<pre
									v-if="resultText"
									class="max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-slate-800 bg-slate-950/40 p-4 font-mono text-xs text-slate-300"
								>{{ resultText }}</pre>
								<div v-else class="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
									<p class="text-sm italic text-slate-500">No result.</p>
								</div>
							</div>
						</div>
					</DashboardSectionCard>
				</div>

				<div class="space-y-4">
					<div>
						<h2 class="text-xl font-semibold text-white">Logs</h2>
						<p class="mt-1 text-sm text-slate-400">Output written by the task while it ran.</p>
					</div>

					<AdminLogViewer
						v-if="task.storeLogs"
						:logs="logs"
						:loading="logsLoading"
						:error="logsError"
						:download-name="`task-${task.id}-logs.txt`"
						:live="isActive"
						height-class="h-[60vh]"
						@refresh="refreshLogs()"
					/>
					<div v-else class="rounded-xl border border-slate-800 bg-slate-900/60 p-8">
						<UEmpty
							icon="i-lucide-file-x"
							title="No logs stored"
							description="This task was started without log storage."
							variant="naked"
						/>
					</div>
				</div>
			</DashboardPageBody>
		</template>
	</UDashboardPanel>
</template>
