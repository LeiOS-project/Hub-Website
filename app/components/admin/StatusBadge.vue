<script setup lang="ts">
/**
 * Status pill for admin lists and detail pages: tasks and OS releases (pending, running, paused,
 * completed, failed), stable promotion requests (pending, queued, released, denied), reports (open,
 * resolved, dismissed) and accounts (active, suspended).
 */
type BadgeColor = "primary" | "secondary" | "success" | "info" | "warning" | "error" | "neutral";

interface StatusStyle {
	color: BadgeColor;
	icon: string;
	spin?: boolean;
}

const props = withDefaults(
	defineProps<{
		status: string;
		/** Text shown instead of the status itself. */
		label?: string;
		size?: "xs" | "sm" | "md" | "lg";
	}>(),
	{
		label: undefined,
		size: "md",
	},
);

const STATUS_STYLES: Record<string, StatusStyle> = {
	pending: { color: "warning", icon: "i-lucide-clock" },
	running: { color: "info", icon: "i-lucide-loader-circle", spin: true },
	paused: { color: "warning", icon: "i-lucide-circle-pause" },
	completed: { color: "success", icon: "i-lucide-circle-check" },
	failed: { color: "error", icon: "i-lucide-circle-x" },
	queued: { color: "info", icon: "i-lucide-list-ordered" },
	released: { color: "success", icon: "i-lucide-circle-check" },
	denied: { color: "error", icon: "i-lucide-circle-x" },
	open: { color: "warning", icon: "i-lucide-flag" },
	resolved: { color: "success", icon: "i-lucide-circle-check" },
	dismissed: { color: "neutral", icon: "i-lucide-circle-slash" },
	active: { color: "success", icon: "i-lucide-circle-check" },
	suspended: { color: "error", icon: "i-lucide-ban" },
};

const style = computed<StatusStyle>(
	() => STATUS_STYLES[props.status] ?? { color: "neutral", icon: "i-lucide-circle-help" },
);
</script>

<template>
	<UBadge :color="style.color" variant="soft" :size="size" class="capitalize">
		<template #leading>
			<UIcon :name="style.icon" :class="['size-3.5 shrink-0', { 'animate-spin': style.spin }]" />
		</template>
		{{ label ?? status }}
	</UBadge>
</template>
