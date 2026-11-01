<script setup lang="ts">
/**
 * Log viewer for task and OS-release publishing logs: per-level counters, search, level filter,
 * timestamps toggle, auto-scroll, copy and download. The caller loads the logs and passes the raw
 * text; `refresh` asks it to load them again.
 */
interface LogEntry {
	timestamp: string;
	level: "info" | "warn" | "error" | "debug" | "success";
	message: string;
	raw: string;
}

const props = withDefaults(
	defineProps<{
		/** Raw log text, one entry per line. `null` / empty shows the empty state. */
		logs: string | null | undefined;
		loading?: boolean;
		/** Error message; shows the error state with a retry button. */
		error?: string | null;
		/** File name for "Download logs". */
		downloadName?: string;
		/** Shows a "Live" indicator in the footer (e.g. while the task is running). */
		live?: boolean;
		emptyTitle?: string;
		emptyDescription?: string;
		/** Height of the scrolling log area. */
		heightClass?: string;
	}>(),
	{
		loading: false,
		error: null,
		downloadName: "logs.txt",
		live: false,
		emptyTitle: "No logs available",
		emptyDescription: "Logs will appear here once the task starts writing them.",
		heightClass: "h-[calc(100vh-235px)]",
	},
);

const emit = defineEmits<{
	refresh: [];
}>();

const toast = useToast();

const LOG_TIMESTAMP_REGEX =
	/^(\[?\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?\]?)\s*/;

const parsedLogs = computed<LogEntry[]>(() => {
	if (!props.logs) return [];

	return props.logs
		.split("\n")
		.filter((line) => line.trim())
		.map((line) => {
			const timestampMatch = line.match(LOG_TIMESTAMP_REGEX);
			const timestamp = timestampMatch?.[1]?.replace(/[[\]]/g, "") || "";
			const message = timestampMatch ? line.slice(timestampMatch[0].length) : line;

			let level: LogEntry["level"] = "info";
			const lower = message.toLowerCase();
			if (lower.includes("[error]") || lower.includes("error:") || lower.startsWith("error")) {
				level = "error";
			} else if (
				lower.includes("[warn]") ||
				lower.includes("warning:") ||
				lower.includes("[warning]")
			) {
				level = "warn";
			} else if (lower.includes("[debug]") || lower.includes("debug:")) {
				level = "debug";
			} else if (
				lower.includes("[success]") ||
				lower.includes("successfully") ||
				lower.includes("completed")
			) {
				level = "success";
			}

			return { timestamp, level, message, raw: line };
		});
});

// Filter state
const searchQuery = ref("");
const selectedLevelObjects = ref<
	Array<{ label: string; value: string; icon: string; color: string }>
>([]);
const showTimestamps = ref(true);
const autoScroll = ref(true);

const levelOptions = [
	{ label: "Info", value: "info", icon: "i-lucide-info", color: "info" },
	{ label: "Success", value: "success", icon: "i-lucide-circle-check", color: "success" },
	{ label: "Warning", value: "warn", icon: "i-lucide-triangle-alert", color: "warning" },
	{ label: "Error", value: "error", icon: "i-lucide-circle-x", color: "error" },
	{ label: "Debug", value: "debug", icon: "i-lucide-bug", color: "neutral" },
];

const selectedLevels = computed(() => selectedLevelObjects.value.map((opt) => opt.value));

const filteredLogs = computed(() => {
	let logs = parsedLogs.value;

	if (selectedLevels.value.length > 0) {
		logs = logs.filter((log) => selectedLevels.value.includes(log.level));
	}

	const query = searchQuery.value.trim().toLowerCase();
	if (query) {
		logs = logs.filter((log) => log.message.toLowerCase().includes(query));
	}

	return logs;
});

const logStats = computed(() => {
	const stats = { total: parsedLogs.value.length, info: 0, success: 0, warn: 0, error: 0, debug: 0 };
	for (const log of parsedLogs.value) stats[log.level]++;
	return stats;
});

const statCards = computed(() => [
	{
		label: "Total",
		value: logStats.value.total,
		icon: "i-lucide-file-text",
		color: "text-slate-300",
	},
	{ label: "Info", value: logStats.value.info, icon: "i-lucide-info", color: "text-sky-400" },
	{
		label: "Success",
		value: logStats.value.success,
		icon: "i-lucide-circle-check",
		color: "text-emerald-400",
	},
	{
		label: "Warnings",
		value: logStats.value.warn,
		icon: "i-lucide-triangle-alert",
		color: "text-amber-400",
	},
	{ label: "Errors", value: logStats.value.error, icon: "i-lucide-circle-x", color: "text-red-400" },
	{ label: "Debug", value: logStats.value.debug, icon: "i-lucide-bug", color: "text-slate-400" },
]);

// Static class names so Tailwind picks them up.
const LEVEL_STYLES: Record<LogEntry["level"], { text: string; icon: string; bg: string }> = {
	error: {
		text: "text-red-400",
		icon: "i-lucide-circle-x",
		bg: "bg-red-500/10 hover:bg-red-500/15",
	},
	warn: {
		text: "text-amber-400",
		icon: "i-lucide-triangle-alert",
		bg: "bg-amber-500/10 hover:bg-amber-500/15",
	},
	success: {
		text: "text-emerald-400",
		icon: "i-lucide-circle-check",
		bg: "bg-emerald-500/10 hover:bg-emerald-500/15",
	},
	debug: {
		text: "text-slate-400",
		icon: "i-lucide-bug",
		bg: "bg-slate-500/10 hover:bg-slate-500/15",
	},
	info: {
		text: "text-sky-400",
		icon: "i-lucide-info",
		bg: "bg-sky-500/10 hover:bg-sky-500/15",
	},
};

const logContainer = useTemplateRef<HTMLElement>("logContainer");

function scrollToBottom() {
	if (logContainer.value && autoScroll.value) {
		logContainer.value.scrollTop = logContainer.value.scrollHeight;
	}
}

async function copyLogs() {
	try {
		await navigator.clipboard.writeText(filteredLogs.value.map((l) => l.raw).join("\n"));
		toast.add({
			title: "Logs copied",
			description: "The shown log entries have been copied to the clipboard.",
			icon: "i-lucide-check",
			color: "success",
		});
	} catch {
		toast.add({
			title: "Copy failed",
			description: "The browser did not allow access to the clipboard.",
			icon: "i-lucide-circle-alert",
			color: "error",
		});
	}
}

function downloadLogs() {
	const blob = new Blob([props.logs || ""], { type: "text/plain" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = props.downloadName;
	a.click();
	URL.revokeObjectURL(url);
}

watch(filteredLogs, () => nextTick(scrollToBottom));
watch(autoScroll, () => nextTick(scrollToBottom));
onMounted(() => nextTick(scrollToBottom));
</script>

<template>
	<div class="space-y-6">
		<!-- Loading (first load only; refreshes keep the current logs on screen) -->
		<div v-if="loading && !logs" class="flex items-center justify-center py-12">
			<div class="flex flex-col items-center gap-3">
				<UIcon name="i-lucide-loader-2" class="animate-spin text-3xl text-slate-400" />
				<span class="text-sm text-slate-400">Loading logs...</span>
			</div>
		</div>

		<!-- Error -->
		<div v-else-if="error" class="rounded-xl border border-red-900/50 bg-red-950/20 p-6">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
					<UIcon name="i-lucide-circle-alert" class="h-5 w-5 text-red-400" />
				</div>
				<div>
					<h3 class="font-medium text-red-400">Failed to load logs</h3>
					<p class="mt-1 text-sm text-slate-400">{{ error }}</p>
				</div>
			</div>
			<UButton
				label="Retry"
				color="error"
				variant="soft"
				icon="i-lucide-refresh-cw"
				class="mt-4"
				@click="emit('refresh');"
			/>
		</div>

		<!-- Empty -->
		<div v-else-if="!logs" class="rounded-xl border border-slate-800 bg-slate-900/60 p-8">
			<div class="flex flex-col items-center text-center">
				<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800">
					<UIcon name="i-lucide-file-text" class="h-6 w-6 text-slate-400" />
				</div>
				<h3 class="font-medium text-white">{{ emptyTitle }}</h3>
				<p class="mt-1 max-w-sm text-sm text-slate-400">{{ emptyDescription }}</p>
				<UButton
					label="Refresh"
					color="neutral"
					variant="subtle"
					icon="i-lucide-refresh-cw"
					class="mt-4"
					:loading="loading"
					@click="emit('refresh');"
				/>
			</div>
		</div>

		<template v-else>
			<!-- Counters -->
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
				<div
					v-for="card in statCards"
					:key="card.label"
					class="rounded-lg border border-slate-800 bg-slate-900/60 p-3"
				>
					<div class="flex items-center gap-2">
						<UIcon :name="card.icon" :class="['h-4 w-4', card.color]" />
						<span class="text-xs text-slate-400">{{ card.label }}</span>
					</div>
					<p :class="['mt-1 text-lg font-semibold', card.color]">{{ card.value }}</p>
				</div>
			</div>

			<div class="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
				<!-- Toolbar -->
				<div
					class="flex flex-col gap-3 border-b border-slate-800 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
				>
					<div class="flex flex-1 flex-col gap-3 sm:flex-row">
						<UInput
							v-model="searchQuery"
							placeholder="Search logs..."
							icon="i-lucide-search"
							class="w-full sm:max-w-xs"
						/>
						<USelectMenu
							v-model="selectedLevelObjects"
							:items="levelOptions"
							multiple
							placeholder="Filter by level"
							class="w-full sm:w-48"
						>
							<template #leading>
								<UIcon name="i-lucide-filter" class="h-4 w-4 text-slate-400" />
							</template>
						</USelectMenu>
					</div>

					<div class="flex items-center gap-2">
						<UTooltip text="Show timestamps">
							<UButton
								icon="i-lucide-clock"
								color="neutral"
								variant="ghost"
								size="sm"
								:class="showTimestamps ? 'text-sky-400' : ''"
								@click="showTimestamps = !showTimestamps;"
							/>
						</UTooltip>
						<UTooltip text="Auto-scroll">
							<UButton
								:icon="autoScroll ? 'i-lucide-arrow-down-to-line' : 'i-lucide-arrow-down'"
								color="neutral"
								variant="ghost"
								size="sm"
								:class="autoScroll ? 'text-sky-400' : ''"
								@click="autoScroll = !autoScroll;"
							/>
						</UTooltip>
						<USeparator orientation="vertical" class="h-5" />
						<UTooltip text="Copy logs">
							<UButton
								icon="i-lucide-copy"
								color="neutral"
								variant="ghost"
								size="sm"
								@click="copyLogs();"
							/>
						</UTooltip>
						<UTooltip text="Download logs">
							<UButton
								icon="i-lucide-download"
								color="neutral"
								variant="ghost"
								size="sm"
								@click="downloadLogs();"
							/>
						</UTooltip>
						<UTooltip text="Refresh">
							<UButton
								icon="i-lucide-refresh-cw"
								color="neutral"
								variant="ghost"
								size="sm"
								:loading="loading"
								@click="emit('refresh');"
							/>
						</UTooltip>
					</div>
				</div>

				<!-- Log output -->
				<div
					ref="logContainer"
					:class="['overflow-y-auto bg-slate-950/50 font-mono text-sm', heightClass]"
				>
					<div
						v-if="filteredLogs.length === 0"
						class="flex h-full flex-col items-center justify-center py-8 text-slate-400"
					>
						<UIcon name="i-lucide-search-x" class="mb-2 h-8 w-8" />
						<span>No logs match your filters</span>
					</div>

					<div v-else class="divide-y divide-slate-800/50">
						<div
							v-for="(log, index) in filteredLogs"
							:key="index"
							:class="['flex items-start gap-3 px-4 py-2 transition-colors', LEVEL_STYLES[log.level].bg]"
						>
							<span class="w-8 shrink-0 select-none text-right text-slate-600">{{ index + 1 }}</span>
							<UIcon
								:name="LEVEL_STYLES[log.level].icon"
								:class="['mt-0.5 h-4 w-4 shrink-0', LEVEL_STYLES[log.level].text]"
							/>
							<span
								v-if="showTimestamps && log.timestamp"
								class="hidden shrink-0 text-slate-500 sm:inline"
							>
								{{ log.timestamp }}
							</span>
							<span :class="['flex-1 break-all', LEVEL_STYLES[log.level].text]">
								{{ log.message }}
							</span>
						</div>
					</div>
				</div>

				<!-- Footer -->
				<div
					class="flex items-center justify-between border-t border-slate-800 px-4 py-2 text-xs text-slate-500"
				>
					<span>Showing {{ filteredLogs.length }} of {{ parsedLogs.length }} log entries</span>
					<span v-if="live" class="flex items-center gap-1.5">
						<span class="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></span>
						Live
					</span>
				</div>
			</div>
		</template>
	</div>
</template>
