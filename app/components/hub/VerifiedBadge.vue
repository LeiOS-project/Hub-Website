<script setup lang="ts">
/**
 * Marks a verified publisher. Renders nothing when `verifiedAt` is empty, an icon with a tooltip
 * by default, and a soft "Verified" badge with `label`.
 */
const props = withDefaults(
	defineProps<{
		verifiedAt: number | null | undefined;
		label?: boolean;
		size?: "sm" | "md" | "lg";
	}>(),
	{
		label: false,
		size: "md",
	},
);

const iconSizeClasses: Record<NonNullable<typeof props.size>, string> = {
	sm: "size-3.5",
	md: "size-4",
	lg: "size-5",
};

const tooltipText = computed(() =>
	props.verifiedAt
		? `Verified publisher since ${new Date(props.verifiedAt).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric",
				timeZone: "UTC",
			})}`
		: "",
);
</script>

<template>
	<UTooltip v-if="verifiedAt" :text="tooltipText">
		<UBadge
			v-if="label"
			color="primary"
			variant="soft"
			icon="i-lucide-badge-check"
			:size="size"
			class="shrink-0"
		>
			Verified
		</UBadge>
		<span v-else class="inline-flex shrink-0 items-center">
			<UIcon
				name="i-lucide-badge-check"
				:class="['text-primary-400', iconSizeClasses[size]]"
				aria-hidden="true"
			/>
			<span class="sr-only">Verified publisher</span>
		</span>
	</UTooltip>
</template>
