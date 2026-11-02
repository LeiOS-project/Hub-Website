<script setup lang="ts">
/**
 * Approve or deny a stable promotion request (`POST /admin/stable-promotion-requests/:id/decide`).
 * A denial needs a note. Emits `decided` after a successful decision.
 */
import type { AdminStableRequest } from "~/utils/adminTypes";

type Decision = "approved" | "denied";

const props = withDefaults(
	defineProps<{
		request: AdminStableRequest | null;
		/** Decision preselected when the modal opens. */
		initialDecision?: Decision;
	}>(),
	{
		initialDecision: "approved",
	},
);

const emit = defineEmits<{
	decided: [decision: Decision];
}>();

const open = defineModel<boolean>("open", { required: true });

const toast = useToast();

const decision = ref<Decision>(props.initialDecision);
const note = ref("");
const submitting = ref(false);

watch(
	open,
	(isOpen) => {
		if (isOpen) {
			decision.value = props.initialDecision;
			note.value = "";
		}
	},
	{ immediate: true },
);

const noteMissing = computed(() => decision.value === "denied" && !note.value.trim());

async function submit() {
	const request = props.request;
	if (!request || noteMissing.value) return;

	submitting.value = true;
	const chosen = decision.value;
	const res = await useAPI((api) =>
		api.postAdminStablePromotionRequestsByStablePromotionRequestIdDecide({
			path: { stablePromotionRequestID: request.id },
			body: { status: chosen, admin_note: note.value.trim() },
		}),
	);
	submitting.value = false;

	if (!res.success) {
		toast.add({
			title: "Failed to submit the decision",
			description: res.message,
			icon: "i-lucide-circle-alert",
			color: "error",
		});
		return;
	}

	toast.add({
		title: chosen === "approved" ? "Request approved" : "Request denied",
		description:
			chosen === "approved"
				? `${request.package_fullname} ${request.package_release_version} moves to stable with the next OS release.`
				: `${request.package_fullname} ${request.package_release_version} stays out of stable.`,
		icon: "i-lucide-check",
		color: "success",
	});
	open.value = false;
	emit("decided", chosen);
}
</script>

<template>
	<DashboardModal
		v-model:open="open"
		:title="`Review Request #${request?.id ?? ''}`"
		description="Approved releases move to stable with the next OS release"
		icon="i-lucide-git-pull-request"
	>
		<div class="space-y-4">
			<div v-if="request" class="space-y-2 rounded-lg bg-slate-800/50 p-4">
				<div class="flex items-center justify-between gap-3">
					<span class="text-sm text-slate-400">Package</span>
					<span class="truncate text-sm font-medium text-slate-200">{{ request.package_fullname }}</span>
				</div>
				<div class="flex items-center justify-between gap-3">
					<span class="text-sm text-slate-400">Release</span>
					<span class="font-mono text-sm text-slate-200">{{ request.package_release_version }}</span>
				</div>
				<div class="flex items-center justify-between gap-3">
					<span class="text-sm text-slate-400">Requested</span>
					<span class="text-sm text-slate-200">{{ formatDate(request.created_at) }}</span>
				</div>
			</div>

			<div class="flex gap-2">
				<UButton
					label="Approve"
					icon="i-lucide-check"
					:color="decision === 'approved' ? 'success' : 'neutral'"
					:variant="decision === 'approved' ? 'solid' : 'outline'"
					:disabled="submitting"
					@click="decision = 'approved';"
				/>
				<UButton
					label="Deny"
					icon="i-lucide-x"
					:color="decision === 'denied' ? 'error' : 'neutral'"
					:variant="decision === 'denied' ? 'solid' : 'outline'"
					:disabled="submitting"
					@click="decision = 'denied';"
				/>
			</div>

			<UFormField
				label="Admin note"
				:required="decision === 'denied'"
				:help="
					decision === 'denied'
						? 'Required: tell the publisher why the release is not promoted.'
						: 'Optional. Shown to the publisher.'
				"
				:error="noteMissing && note.length > 0 ? 'Add a reason for the denial' : undefined"
			>
				<UTextarea
					v-model="note"
					placeholder="Add a note for this decision..."
					:disabled="submitting"
					:rows="4"
					autoresize
					class="w-full"
				/>
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
					:label="decision === 'approved' ? 'Approve Request' : 'Deny Request'"
					:icon="decision === 'approved' ? 'i-lucide-check' : 'i-lucide-x'"
					:color="decision === 'approved' ? 'success' : 'error'"
					:loading="submitting"
					:disabled="noteMissing"
					@click="submit();"
				/>
			</div>
		</template>
	</DashboardModal>
</template>
