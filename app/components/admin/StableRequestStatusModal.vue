<script setup lang="ts">
/**
 * Change the status of a stable promotion request (`PUT /admin/stable-promotion-requests/:id/status`):
 * queue it for the next OS release, deny it, or set it back to review. The optional comment
 * (Markdown) appears in the request's conversation; a denial needs one. Emits `changed`.
 */
import { STABLE_STATUS_META, type StablePromotionStatus } from "~/utils/stablePromotion";

type ReviewStatus = Exclude<StablePromotionStatus, "released">;

const props = withDefaults(
	defineProps<{
		request: {
			id: number;
			status: StablePromotionStatus;
			package_fullname: string;
			package_release_version: string;
		} | null;
		/** Status preselected when the modal opens. */
		initialStatus?: ReviewStatus;
	}>(),
	{
		initialStatus: "queued",
	},
);

const emit = defineEmits<{
	changed: [status: ReviewStatus];
}>();

const open = defineModel<boolean>("open", { required: true });

const toast = useToast();

const OPTIONS: {
	value: ReviewStatus;
	label: string;
	icon: string;
	color: "info" | "error" | "warning";
}[] = [
	{ value: "queued", label: "Queue for stable", icon: "i-lucide-list-plus", color: "info" },
	{ value: "denied", label: "Deny", icon: "i-lucide-x", color: "error" },
	{ value: "pending", label: "Back to review", icon: "i-lucide-rotate-ccw", color: "warning" },
];

const options = computed(() => OPTIONS.filter((option) => option.value !== props.request?.status));

const status = ref<ReviewStatus>(props.initialStatus);
const message = ref("");
const submitting = ref(false);

watch(
	open,
	(isOpen) => {
		if (!isOpen) return;
		status.value =
			props.initialStatus !== props.request?.status
				? props.initialStatus
				: (options.value[0]?.value ?? "queued");
		message.value = "";
	},
	{ immediate: true },
);

const messageMissing = computed(() => status.value === "denied" && !message.value.trim());

const HINTS: Record<ReviewStatus, string> = {
	queued: "The release joins the stable queue. The next OS release can include it.",
	denied: "The release stays out of stable. Tell the publisher why.",
	pending: "The request goes back to review; a queued release leaves the stable queue.",
};

async function submit() {
	const request = props.request;
	if (!request || messageMissing.value) return;

	submitting.value = true;
	const chosen = status.value;
	const res = await useAPI((api) =>
		api.putAdminStablePromotionRequestsByStablePromotionRequestIdStatus({
			path: { stablePromotionRequestID: request.id },
			body: { status: chosen, message: message.value.trim() || undefined },
		}),
	);
	submitting.value = false;

	if (!res.success) {
		toast.add({
			title: "Failed to change the status",
			description: res.message,
			icon: "i-lucide-circle-alert",
			color: "error",
		});
		return;
	}

	toast.add({
		title: STABLE_STATUS_META[chosen].label,
		description: `${request.package_fullname} ${request.package_release_version}: ${HINTS[chosen]}`,
		icon: STABLE_STATUS_META[chosen].icon,
		color: "success",
	});
	open.value = false;
	emit("changed", chosen);
}
</script>

<template>
	<DashboardModal
		v-model:open="open"
		:title="`Review request #${request?.id ?? ''}`"
		:description="request ? `${request.package_fullname} ${request.package_release_version}` : undefined"
		icon="i-lucide-git-pull-request"
	>
		<div class="space-y-4">
			<div class="flex flex-wrap gap-2">
				<UButton
					v-for="option in options"
					:key="option.value"
					:label="option.label"
					:icon="option.icon"
					:color="status === option.value ? option.color : 'neutral'"
					:variant="status === option.value ? 'solid' : 'outline'"
					:disabled="submitting"
					@click="status = option.value;"
				/>
			</div>

			<p class="text-sm text-slate-400">{{ HINTS[status] }}</p>

			<UFormField
				label="Message to the publisher"
				:required="status === 'denied'"
				:help="status === 'denied' ? 'Required for a denial.' : 'Optional. Appears in the conversation.'"
			>
				<MarkdownEditor v-model="message" :disabled="submitting" min-height-class="min-h-24" />
			</UFormField>
		</div>

		<template #footer>
			<div class="flex justify-end gap-2">
				<UButton
					label="Cancel"
					color="neutral"
					variant="ghost"
					:disabled="submitting"
					@click="open = false;"
				/>
				<UButton
					:label="options.find((option) => option.value === status)?.label ?? 'Save'"
					:icon="options.find((option) => option.value === status)?.icon"
					:color="options.find((option) => option.value === status)?.color ?? 'primary'"
					:loading="submitting"
					:disabled="messageMissing"
					@click="submit()"
				/>
			</div>
		</template>
	</DashboardModal>
</template>
