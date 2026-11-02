<script lang="ts" setup>
import type { AdminOSRelease } from "~/utils/adminTypes";

const os_release = useSubrouterInjectedData<AdminOSRelease>("os_release").inject();
const os_release_data = os_release.data;
const version = os_release_data.value.version;

const {
	data: logsResult,
	refresh: refreshLogs,
	loading: logsLoading,
} = await useAPIAsyncData(
	`admin-os-release:${version}:logs`,
	async () =>
		await useAPI((api) => api.getAdminOsReleasesByVersionPublishingLogs({ path: { version } })),
);

const logs = computed(() => (logsResult.value?.success ? logsResult.value.data.logs : null));

// 404 = the publishing task has not written a log file yet: show the empty state, not an error.
const logsError = computed(() => {
	const result = logsResult.value;
	if (!result || result.success || (result.code as number) === 404) return null;
	return result.message || "An error occurred while fetching the logs.";
});

async function onRefresh() {
	await Promise.all([refreshLogs(), os_release.refresh()]);
}
</script>

<template>
	<div class="space-y-6">
		<div>
			<h2 class="text-xl font-semibold text-white">Publishing Logs</h2>
			<p class="mt-1 text-sm text-slate-400">
				View the publishing logs for OS Release {{ os_release_data.version }}.
			</p>
		</div>

		<AdminLogViewer
			:logs="logs"
			:loading="logsLoading"
			:error="logsError"
			:download-name="`os-release-${os_release_data.version}-logs.txt`"
			:live="os_release_data.publishing_status === 'running'"
			empty-description="Publishing logs will appear here once the release publishing process starts."
			@refresh="onRefresh()"
		/>
	</div>
</template>
