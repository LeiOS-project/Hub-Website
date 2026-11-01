<script setup lang="ts">
import type { AuthFormField, FormError, FormSubmitEvent } from "@nuxt/ui";
import type { z } from "zod";
import { zPostAuthSignupBody } from "~/api-client/zod.gen";

definePageMeta({
	layout: "auth",
});

useSeoMeta({
	title: "Sign Up | LeiOS Hub",
	description: "Create a LeiOS Hub account to publish packages and report problems.",
});

const toast = useToast();

// The generated body schema is the source of truth for the rules; `validate` adds the
// confirmation field and readable messages (it runs first, so its message is the one shown).
const signupSchema = zPostAuthSignupBody;
type SignupSchema = z.output<typeof signupSchema>;
type SignupFormState = Partial<SignupSchema & { confirm_password: string }>;

const fieldMessages: Record<keyof SignupSchema, string> = {
	username:
		"Use 5–40 lowercase letters, numbers, dots, underscores or hyphens, starting with a letter or number.",
	display_name: "Enter a display name (up to 64 characters).",
	email: "Enter a valid email address.",
	password:
		"Use 8–50 characters with an uppercase and a lowercase letter, a number and a special character.",
};

const fields: AuthFormField[] = [
	{
		name: "username",
		type: "text",
		label: "Username",
		placeholder: "e.g. jane.doe",
		autocomplete: "username",
		required: true,
	},
	{
		name: "display_name",
		type: "text",
		label: "Display name",
		placeholder: "e.g. Jane Doe",
		autocomplete: "name",
		required: true,
	},
	{
		name: "email",
		type: "email",
		label: "Email address",
		placeholder: "you@example.com",
		autocomplete: "email",
		required: true,
	},
	{
		name: "password",
		type: "password",
		label: "Password",
		placeholder: "Choose a password",
		autocomplete: "new-password",
		required: true,
	},
	{
		name: "confirm_password",
		type: "password",
		label: "Confirm password",
		placeholder: "Re-enter your password",
		autocomplete: "new-password",
		required: true,
	},
];

function validate(state: SignupFormState): FormError[] {
	const errors: FormError[] = [];

	for (const name of Object.keys(fieldMessages) as (keyof SignupSchema)[]) {
		if (!signupSchema.shape[name].safeParse(state[name]).success) {
			errors.push({ name, message: fieldMessages[name] });
		}
	}

	if (!state.confirm_password) {
		errors.push({ name: "confirm_password", message: "Confirm your password." });
	} else if (state.password !== state.confirm_password) {
		errors.push({ name: "confirm_password", message: "Passwords do not match." });
	}

	return errors;
}

const loading = ref(false);
/** The address the confirmation email went to; set after a successful signup. */
const signedUpEmail = ref<string | null>(null);
const resending = ref(false);

async function onSubmit(payload: FormSubmitEvent<SignupSchema>) {
	if (loading.value) return;
	loading.value = true;

	const result = await useAPI(
		(api) =>
			api.postAuthSignup({
				body: {
					username: payload.data.username,
					display_name: payload.data.display_name,
					email: payload.data.email,
					password: payload.data.password,
				},
			}),
		true,
	);

	loading.value = false;

	if (result.success) {
		signedUpEmail.value = result.data.email;
		return;
	}

	const code = result.code as number;
	const titles: Record<number, string> = {
		403: "Signup is not available",
		409: "Already taken",
		429: "Too many attempts",
	};

	toast.add({
		title: titles[code] ?? "Signup failed",
		description: result.message || "An error occurred during signup. Please try again later.",
		icon: "i-lucide-alert-circle",
		color: "error",
	});

	// Signup may have been switched off since the page loaded: show the "closed" state then.
	if (code === 403) await refreshNuxtData("hub-meta");
}

async function resendConfirmation() {
	if (!signedUpEmail.value || resending.value) return;
	const email = signedUpEmail.value;

	resending.value = true;
	const result = await useAPI((api) => api.postAuthVerifyEmailResend({ body: { email } }), true);
	resending.value = false;

	if (!result.success) {
		toast.add({
			title: "Could not resend the email",
			description: result.message,
			icon: "i-lucide-alert-circle",
			color: "error",
		});
		return;
	}

	toast.add({
		title: "Email sent",
		description: `If ${email} still needs confirming, a new link is on its way.`,
		icon: "i-lucide-mail-check",
		color: "success",
	});
}
</script>

<template>
	<HubMetaProvider v-slot="{ signupEnabled }">
		<div v-if="signedUpEmail" class="space-y-4 text-center">
			<div class="flex justify-center">
				<div class="rounded-full bg-primary-500/10 p-3">
					<UIcon name="i-lucide-mail-check" class="size-8 text-primary-400" />
				</div>
			</div>
			<h2 class="text-xl font-semibold text-white">Check your inbox</h2>
			<p class="mx-auto max-w-sm text-sm text-slate-400">
				We sent a confirmation link to
				<span class="font-medium break-all text-slate-200">{{ signedUpEmail }}</span>. You can log
				in right away; creating publishers and reporting unlock once you confirm your address.
			</p>
			<UButton to="/auth/login" icon="i-lucide-log-in" color="primary" block>Go to login</UButton>
			<p class="text-xs text-slate-500">
				Didn't get the email? Check your spam folder or
				<UButton
					variant="link"
					color="primary"
					size="xs"
					class="p-0"
					:loading="resending"
					@click="resendConfirmation();"
				>
					send it again
				</UButton>
			</p>
		</div>

		<UAuthForm
			v-else-if="signupEnabled"
			:schema="signupSchema"
			:validate="validate"
			title="Create an account"
			description="Publish packages for LeiOS and help keep the Hub clean."
			icon="i-lucide-user-plus"
			:fields="fields"
			:submit="{ label: 'Sign up', loading, disabled: loading }"
			@submit="onSubmit"
		>
			<template #footer>
				<div class="text-center text-sm">
					Already have an account?
					<NuxtLink to="/auth/login" class="text-primary hover:underline">Log in</NuxtLink>
				</div>
			</template>
		</UAuthForm>

		<div v-else class="space-y-4 text-center">
			<div class="flex justify-center">
				<div class="rounded-full bg-slate-800 p-3">
					<UIcon name="i-lucide-door-closed" class="size-8 text-slate-400" />
				</div>
			</div>
			<h2 class="text-xl font-semibold text-white">Signup is currently closed</h2>
			<p class="mx-auto max-w-sm text-sm text-slate-400">
				New accounts can't be created right now. Please check back later. You can still browse
				every package without an account.
			</p>
			<div class="flex flex-col gap-2 sm:flex-row sm:justify-center">
				<UButton to="/explore" icon="i-lucide-compass" color="primary">Explore packages</UButton>
				<UButton to="/auth/login" icon="i-lucide-log-in" color="neutral" variant="outline">
					Log in
				</UButton>
			</div>
		</div>
	</HubMetaProvider>
</template>
