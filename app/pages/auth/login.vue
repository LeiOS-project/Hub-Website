<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from "@nuxt/ui";
import * as z from "zod";
import { useUserInfoStore } from "~/composables/stores/useUserStore";

definePageMeta({
	layout: "auth",
});

useSeoMeta({
	title: "Login | LeiOS Hub",
	description: "Login to your account",
});

const route = useRoute();
const toast = useToast();

// Only follow internal redirects (`/…`, not `//evil.example`); default to the dashboard.
const requestedUrl = route.query.url?.toString() ?? "";
const redirectUrl =
	requestedUrl.startsWith("/") && !requestedUrl.startsWith("//") ? requestedUrl : "/dashboard";

const fields: AuthFormField[] = [
	{
		name: "username",
		type: "text",
		label: "Username",
		placeholder: "Enter your username",
		required: true,
	},
	{
		name: "password",
		label: "Password",
		type: "password",
		placeholder: "Enter your password",
		required: true,
	},
	{
		name: "remember",
		label: "Remember me",
		type: "checkbox",
		description: "You will stay logged in for 30 days.",
	},
];

const schema = z.object({
	username: z.string("Username is required").trim().min(1, "Username is required"),
	password: z.string("Password is required").min(1, "Password is required"),
	remember: z.boolean().optional(),
});

type Schema = z.output<typeof schema>;

const loading = ref(false);

async function onSubmit(payload: FormSubmitEvent<Schema>) {
	loading.value = true;

	const result = await useAPI(
		(api) =>
			api.postAuthLogin({
				body: { username: payload.data.username, password: payload.data.password },
			}),
		true,
	);

	loading.value = false;

	if (!result.success) {
		const code = result.code as number;
		const invalidCredentials = code === 401;
		// 403 is a suspended account (or a session that is already signed in), 429 the rate limit;
		// the API's message says which.
		const titles: Record<number, string> = {
			401: "Invalid Username or Password",
			403: "Login Not Possible",
			429: "Too Many Attempts",
		};
		toast.add({
			title: titles[code] ?? "Login Failed",
			description: invalidCredentials
				? "Please check your credentials and try again."
				: result.message || "An error occurred during login. Please try again later.",
			icon: "i-lucide-alert-circle",
			color: "error",
		});
		return;
	}

	updateAPIClient(result.data.token);
	useAppCookies().sessionToken.set(result.data.token, {
		maxAge: payload.data.remember ? 60 * 60 * 24 * 30 : undefined, // 30 days only with "remember me"
	});

	// Fresh per-user state for the new session.
	await useUserInfoStore().refresh();

	toast.add({
		title: "Login Successful",
		description: "You have been logged in successfully.",
		icon: "i-lucide-check",
		color: "success",
	});

	await navigateTo(redirectUrl);
}
</script>

<template>
	<UAuthForm
		:schema="schema"
		title="Login"
		description="Enter your credentials to access your account."
		icon="i-lucide-user"
		:fields="fields"
		:submit="{ label: 'Login', loading }"
		@submit="onSubmit"
	>
		<template #footer>
			<div class="text-center text-sm">
				Forgot your password?
				<NuxtLink to="/auth/forgot-password" class="text-primary hover:underline">
					Reset here
				</NuxtLink>
			</div>
			<HubMetaProvider v-slot="{ signupEnabled }">
				<div v-if="signupEnabled" class="mt-2 text-center text-sm">
					Don't have an account?
					<NuxtLink to="/auth/signup" class="text-primary hover:underline">Sign up</NuxtLink>
				</div>
			</HubMetaProvider>
		</template>
	</UAuthForm>
</template>
