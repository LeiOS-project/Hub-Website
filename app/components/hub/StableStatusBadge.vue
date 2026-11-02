<script setup lang="ts">
/**
 * Where a release stands on its way to stable: awaiting review, queued for the next LeiOS
 * release, released (with the OS release version) or denied. Hover for an explanation.
 */
import {
	STABLE_STATUS_META,
	type StablePromotionStatus,
	stableStatusLabel,
} from "~/utils/stablePromotion";

const props = withDefaults(
	defineProps<{
		status: StablePromotionStatus;
		osReleaseVersion?: string | null;
		size?: "xs" | "sm" | "md" | "lg";
	}>(),
	{
		osReleaseVersion: null,
		size: "sm",
	},
);

const meta = computed(() => STABLE_STATUS_META[props.status]);
</script>

<template>
	<UTooltip :text="meta.description">
		<UBadge :color="meta.color" variant="soft" :size="size" :icon="meta.icon">
			{{ stableStatusLabel(status, osReleaseVersion) }}
		</UBadge>
	</UTooltip>
</template>
