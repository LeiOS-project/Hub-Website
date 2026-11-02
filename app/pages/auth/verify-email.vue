<script setup lang="ts">
/**
 * Target of the confirmation link in signup / email-change emails (`?token=`). Works signed in and
 * signed out (`AUTH_ROUTES_FOR_EVERYONE` in auth.global.ts).
 */
import type { FormSubmitEvent } from "@nuxt/ui";
import type { z } from "zod";
import { zPostAuthVerifyEmailResendBody } from "~/api-client/zod.gen";
import { useUserInfoStore } from "~/composables/stores/useUserStore";

definePageMeta({
	layout: "auth",
});

useSeoMeta({
	title: "Confirm Email | LeiOS Hub",
	description: "Confirm the email address of your LeiOS Hub account.",
	robots: "noindex, nofollow",
});

const route = useRoute();
const toast = useToast();
const userInfoStore = useUserInfoStore();
const user = await userInfoStore.use();

const token = route.query.token?.toString() ?? "";

type VerifyState = "verifying" | "confirmed" | "invalid" | "conflict" | "error";
const state = ref<VerifyState>(token ? "verifying" : "invalid");
const errorMessage = ref("");

async function verify() {
	state.value = "verifying";
	const result = await useAPI((api) => api.postAuthVerifyEmail({ body: { token } }), true);

	if (result.success) {
		state.value = "confirmed";
		// The signed-in account may be the one that was just confirmed.
		if (user.value) await userInfoStore.refresh();
		return;
	}

	const code = result.code as number;
	if (code === 400) {
		state.value = "invalid";
	} else if (code === 409) {
		state.value = "conflict";
	} else {
		state.value = "error";
		errorMessage.value = result.message;
	}
}

onMounted(() => {
	if (token) verify();
});

// Resend form for invalid or expired links.
const resendSchema = zPostAuthVerifyEmailResendBody;
type ResendSchema = z.output<typeof resendSchema>;

const resendState = reactive<Partial<ResendSchema>>({
	email: user.value?.email ?? "",
});
const resending = ref(false);
const resent = ref(false);

async function onResend(event: FormSubmitEvent<ResendSchema>) {
	resending.value = true;
	const result = await useAPI(
		(api) => api.postAuthVerifyEmailResend({ body: { email: event.data.email } }),
		true,
	);
	resending.value = false;

	if (!result.success) {
		toast.add({
			title: "Could not send the email",
			description: result.message,
			icon: "i-lucide-alert-circle",
			color: "error",
		});
		return;
	}
	resent.value = true;
}

const continueAction = computed(() =>
	user.value
		? { label: "Open dashboard", to: "/dashboard", icon: "i-lucide-layout-dashboard" }
		: { label: "Log in", to: "/auth/login", icon: "i-lucide-log-in" },
);
</script>

<template>
	<div class="space-y-4 text-center">
		<template v-if="state === 'verifying'">
			<div class="flex justify-center py-2">
				<UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-slate-400" />
			</div>
			<h2 class="text-xl font-semibold text-white">Confirming your email address…</h2>
		</template>

		<template v-else-if="state === 'confirmed'">
			<div class="flex justify-center">
				<div class="rounded-full bg-emerald-500/10 p-3">
					<UIcon name="i-lucide-badge-check" class="size-8 text-emerald-400" />
				</div>
			</div>
			<h2 class="text-xl font-semibold text-white">Email address confirmed</h2>
			<p class="mx-auto max-w-sm text-sm text-slate-400">
				Thanks! Your email address is confirmed. You can now create publishers and report
				packages.
			</p>
			<UButton :to="continueAction.to" :icon="continueAction.icon" color="primary" block>
				{{ continueAction.label }}
			</UButton>
		</template>

		<template v-else-if="state === 'conflict'">
			<div class="flex justify-center">
				<div class="rounded-full bg-amber-500/10 p-3">
					<UIcon name="i-lucide-mail-x" class="size-8 text-amber-400" />
				</div>
			</div>
			<h2 class="text-xl font-semibold text-white">Address already in use</h2>
			<p class="mx-auto max-w-sm text-sm text-slate-400">
				Another account confirmed this email address first, so it can't be confirmed for this
				account. Use a different address in your account settings.
			</p>
			<UButton
				:to="user ? '/dashboard/settings' : '/auth/login'"
				:icon="user ? 'i-lucide-settings' : 'i-lucide-log-in'"
				color="primary"
				block
			>
				{{ user ? "Open account settings" : "Log in" }}
			</UButton>
		</template>

		<template v-else>
			<div class="flex justify-center">
				<div class="rounded-full bg-red-500/10 p-3">
					<UIcon name="i-lucide-link-2-off" class="size-8 text-red-400" />
				</div>
			</div>
			<h2 class="text-xl font-semibold text-white">
				{{ state === "error" ? "Something went wrong" : "This link is invalid or has expired" }}
			</h2>
			<p class="mx-auto max-w-sm text-sm text-slate-400">
				{{
					state === "error"
						? errorMessage || "The email address could not be confirmed. Please try again later."
						: "Confirmation links work once and expire after 24 hours. Request a new one below."
				}}
			</p>

			<UAlert
				v-if="resent"
				color="success"
				variant="subtle"
				icon="i-lucide-mail-check"
				title="Check your inbox"
				description="If an unconfirmed account uses this address, a new confirmation link is on its way."
				class="text-left"
			/>
			<UForm
				v-else
				:schema="resendSchema"
				:state="resendState"
				class="space-y-3 text-left"
				@submit="onResend"
			>
				<UFormField name="email" label="Email address" required>
					<UInput
						v-model="resendState.email"
						type="email"
						autocomplete="email"
						placeholder="you@example.com"
						class="w-full"
					/>
				</UFormField>
				<UButton type="submit" icon="i-lucide-send" color="primary" block :loading="resending">
					Send a new link
				</UButton>
			</UForm>

			<NuxtLink
				:to="continueAction.to"
				class="inline-block text-sm text-primary hover:underline"
			>
				{{ user ? "Back to the dashboard" : "Back to login" }}
			</NuxtLink>
		</template>
	</div>
</template>
