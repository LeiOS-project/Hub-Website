<script setup lang="ts">
/** Badge for a report's reason (malware, spam, copyright, …). */
import type { AdminReportReason } from "~/utils/adminTypes";

withDefaults(
	defineProps<{
		reason: AdminReportReason;
		size?: "xs" | "sm" | "md" | "lg";
	}>(),
	{
		size: "md",
	},
);

const REASONS: Record<
	AdminReportReason,
	{ label: string; color: "error" | "warning" | "neutral"; icon: string }
> = {
	malware: { label: "Malware", color: "error", icon: "i-lucide-bug" },
	spam: { label: "Spam", color: "warning", icon: "i-lucide-mail-warning" },
	copyright: { label: "Copyright", color: "warning", icon: "i-lucide-copyright" },
	inappropriate: {
		label: "Inappropriate",
		color: "warning",
		icon: "i-lucide-message-square-warning",
	},
	broken: { label: "Broken", color: "neutral", icon: "i-lucide-wrench" },
	impersonation: { label: "Impersonation", color: "warning", icon: "i-lucide-venetian-mask" },
	other: { label: "Other", color: "neutral", icon: "i-lucide-circle-help" },
};
</script>

<template>
	<UBadge
		:color="REASONS[reason]?.color ?? 'neutral'"
		:icon="REASONS[reason]?.icon"
		variant="soft"
		:size="size"
	>
		{{ REASONS[reason]?.label ?? reason }}
	</UBadge>
</template>
