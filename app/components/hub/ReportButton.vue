<script setup lang="ts">
/**
 * "Report" button for package and publisher pages. Signed-out visitors go to the login page
 * (and come back here afterwards); signed-in users get the `HubReportModal`.
 */
import { useUserInfoStore } from "~/composables/stores/useUserStore";
import type { ReportTargetType } from "~/utils/hubTypes";

defineOptions({ inheritAttrs: false });

defineProps<{
	targetType: ReportTargetType;
	targetName: string;
	targetLabel?: string;
}>();

const route = useRoute();
const user = await useUserInfoStore().use();

const open = ref(false);

async function onClick() {
	if (!user.value) {
		await navigateTo(`/auth/login?url=${encodeURIComponent(route.fullPath)}`);
		return;
	}
	open.value = true;
}
</script>

<template>
	<UButton
		icon="i-lucide-flag"
		color="neutral"
		variant="ghost"
		v-bind="$attrs"
		@click="onClick();"
	>
		Report
	</UButton>

	<HubReportModal
		v-if="user"
		v-model:open="open"
		:target-type="targetType"
		:target-name="targetName"
		:target-label="targetLabel"
		:email-confirmed="user.email_verified_at !== null"
	/>
</template>
