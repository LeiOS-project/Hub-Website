<script setup lang="ts">
import { useUserInfoStore } from "~/composables/stores/useUserStore";

/**
 * Warns signed-in users whose email address is not confirmed yet (creating publishers and
 * reporting need a confirmed address) and lets them resend the confirmation email.
 */
const props = defineProps<{
	/** What the user cannot do until they confirm, appended to the message. */
	reason?: string;
}>();

const toast = useToast();
const userInfoStore = useUserInfoStore();
const user = await userInfoStore.use();

const sending = ref(false);

const needsConfirmation = computed(
	() => userInfoStore.isValid(user) && user.value.email_verified_at === null,
);

async function resend() {
	sending.value = true;
	const res = await useAPI((api) => api.postAccountEmailVerification({}));
	sending.value = false;

	if (res.success) {
		toast.add({
			title: "Confirmation email sent",
			description: `Check the inbox of ${user.value?.email}.`,
			icon: "i-lucide-mail-check",
			color: "success",
		});
		return;
	}

	// The SDK types only the fallback 500; the API answers 409 when the address is confirmed.
	if ((res.code as number) === 409) {
		// Confirmed in the meantime (e.g. in another tab).
		await userInfoStore.refresh();
		return;
	}

	toast.add({
		title: "Could not send the email",
		description: res.message,
		icon: "i-lucide-alert-circle",
		color: "error",
	});
}
</script>

<template>
	<UAlert
		v-if="needsConfirmation"
		color="warning"
		variant="subtle"
		icon="i-lucide-mail-warning"
		title="Confirm your email address"
		:description="`We sent a confirmation link to ${user?.email}. ${props.reason ?? 'Some features stay locked until you confirm it.'}`"
		:actions="[
			{
				label: 'Resend email',
				color: 'warning',
				variant: 'soft',
				icon: 'i-lucide-send',
				loading: sending,
				onClick: resend,
			},
		]"
	/>
</template>
