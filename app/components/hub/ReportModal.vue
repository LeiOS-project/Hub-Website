<script setup lang="ts">
/**
 * Report a package or publisher to the moderators (`POST /reports`). Needs a signed-in user;
 * open it through `HubReportButton`, which sends signed-out visitors to the login page first.
 */
import type { FormSubmitEvent } from "@nuxt/ui";
import * as z from "zod";
import { zPostReportsBody } from "~/api-client/zod.gen";
import type { ReportReason, ReportTargetType } from "~/utils/hubTypes";

const props = defineProps<{
	targetType: ReportTargetType;
	/** `fullname` of a package or `name` of a publisher. */
	targetName: string;
	/** Human-readable name shown in the modal. */
	targetLabel?: string;
	/** `false` shows a hint that reporting needs a confirmed email address. */
	emailConfirmed?: boolean;
}>();

const open = defineModel<boolean>("open", { required: true });

const toast = useToast();
const formId = useId();

const reasonLabels: Record<ReportReason, string> = {
	malware: "Malware or harmful code",
	spam: "Spam or misleading content",
	copyright: "Copyright or license violation",
	inappropriate: "Inappropriate content",
	broken: "Broken or does not install",
	impersonation: "Impersonation",
	other: "Something else",
};

const reasonItems = zPostReportsBody.shape.reason.options.map((value) => ({
	label: reasonLabels[value],
	value,
}));

// The generated body schema has no user-facing messages, so the form uses its own (same rules).
const reportSchema = z.object({
	reason: z.enum(zPostReportsBody.shape.reason.options, "Choose a reason"),
	details: z.string().trim().max(2000, "Keep the details under 2000 characters").optional(),
});
type ReportSchema = z.output<typeof reportSchema>;

const formState = reactive<{ reason: ReportReason | undefined; details: string }>({
	reason: undefined,
	details: "",
});

const submitting = ref(false);

const targetTypeLabel = computed(() => (props.targetType === "package" ? "package" : "publisher"));

watch(open, (isOpen) => {
	if (isOpen) {
		formState.reason = undefined;
		formState.details = "";
	}
});

async function onSubmit(event: FormSubmitEvent<ReportSchema>) {
	submitting.value = true;
	const res = await useAPI((api) =>
		api.postReports({
			body: {
				target_type: props.targetType,
				target_name: props.targetName,
				reason: event.data.reason,
				details: event.data.details || undefined,
			},
		}),
	);
	submitting.value = false;

	if (!res.success) {
		toast.add({
			title: "Could not send the report",
			description: res.message,
			icon: "i-lucide-alert-circle",
			color: "error",
		});
		return;
	}

	toast.add({
		title: "Report submitted",
		description: "Thank you! The moderators will take a look.",
		icon: "i-lucide-check",
		color: "success",
	});
	open.value = false;
}
</script>

<template>
	<DashboardModal
		v-model:open="open"
		:title="`Report ${targetTypeLabel}`"
		:description="targetLabel ?? targetName"
		icon="i-lucide-flag"
		icon-color="error"
	>
		<div class="space-y-4">
			<UAlert
				v-if="emailConfirmed === false"
				color="warning"
				variant="subtle"
				icon="i-lucide-mail-warning"
				title="Confirm your email address first"
				description="Reports need a confirmed email address. Use the link we emailed you, or resend it from your dashboard."
			/>

			<p class="text-sm text-slate-400">
				Tell the moderators what is wrong with this {{ targetTypeLabel }}. Only the Hub's
				moderators see reports.
			</p>

			<UForm
				:id="formId"
				:schema="reportSchema"
				:state="formState"
				class="space-y-4"
				@submit="onSubmit"
			>
				<UFormField name="reason" label="Reason" required>
					<USelect
						v-model="formState.reason"
						:items="reasonItems"
						placeholder="Choose a reason"
						class="w-full"
					/>
				</UFormField>

				<UFormField
					name="details"
					label="Details"
					description="Optional. Links, affected versions or what you noticed."
				>
					<UTextarea
						v-model="formState.details"
						:rows="4"
						:maxlength="2000"
						autoresize
						placeholder="Describe the problem"
						class="w-full"
					/>
				</UFormField>
			</UForm>
		</div>

		<template #footer>
			<UButton color="neutral" variant="ghost" @click="open = false;">Cancel</UButton>
			<UButton
				type="submit"
				:form="formId"
				color="error"
				icon="i-lucide-flag"
				:loading="submitting"
			>
				Send report
			</UButton>
		</template>
	</DashboardModal>
</template>
