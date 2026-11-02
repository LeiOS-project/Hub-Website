<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import * as z from "zod";
import { useUserInfoStore } from "~/composables/stores/useUserStore";

useSeoMeta({
	title: "General | Settings | LeiOS Hub",
	description: "Manage your profile information",
});

const toast = useToast();

const userInfoStore = useUserInfoStore();
const userInfo = await userInfoStore.use();
if (!userInfoStore.isValid(userInfo)) {
	throw createError({ statusCode: 401, statusMessage: "Not authenticated" });
}

// Same rules as the API's UserDataPolicies.Username (see zPostAuthSignupBody), with readable messages.
const profileSchema = z.object({
	username: z
		.string()
		.trim()
		.min(5, "Must be at least 5 characters")
		.max(40, "Must be at most 40 characters")
		.regex(
			/^(?!.*[.-]{2})[a-z0-9](?:[a-z0-9._-]{3,38}[a-z0-9_])?$/,
			"Lowercase letters, numbers, dots, underscores and hyphens; must start with a letter or number",
		),
	display_name: z.string().trim().max(64, "Must be at most 64 characters").optional(),
	email: z.email("Invalid email").trim(),
	current_password: z.string().min(1, "Current password is required to save changes"),
});

type ProfileSchema = z.output<typeof profileSchema>;

const profile = reactive<Partial<ProfileSchema>>({
	username: userInfo.value.username,
	display_name: userInfo.value.display_name || "",
	email: userInfo.value.email,
	current_password: "",
});

const loading = ref(false);

async function onSubmit(event: FormSubmitEvent<ProfileSchema>) {
	loading.value = true;

	const result = await useAPI((api) =>
		api.putAccount({
			body: {
				username: event.data.username,
				display_name: event.data.display_name || undefined,
				email: event.data.email,
				current_password: event.data.current_password,
			},
		}),
	);

	loading.value = false;

	if (result.success) {
		const emailChanged = event.data.email !== userInfo.value?.email;

		// Refetch: a changed email address is unconfirmed again (email_verified_at is reset).
		await userInfoStore.refresh();
		profile.current_password = "";

		toast.add({
			title: "Profile updated",
			description: emailChanged
				? `We sent a confirmation link to ${event.data.email}.`
				: "Your profile has been successfully updated.",
			icon: "i-lucide-check",
			color: "success",
		});
	} else {
		toast.add({
			title: "Error",
			description: result.message || "An error occurred while updating your profile.",
			icon: "i-lucide-alert-circle",
			color: "error",
		});
	}
}
</script>

<template>
	<div class="space-y-6">
		<div>
			<h2 class="text-xl font-semibold text-white">Profile Settings</h2>
			<p class="mt-1 text-sm text-slate-400">Manage your public profile information</p>
		</div>

		<DashboardEmailVerificationNotice />

		<DashboardSectionCard
			title="Profile Information"
			description="Update your account profile details"
			icon="i-lucide-user"
		>
			<UForm
				id="settings"
				:schema="profileSchema"
				:state="profile"
				class="divide-y divide-slate-800"
				@submit="onSubmit"
			>
				<UFormField
					name="username"
					label="Username"
					description="Your unique username for logging in."
					required
					class="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0 max-sm:flex-col"
					:ui="{ root: 'w-full sm:w-auto', container: 'w-full sm:w-auto' }"
				>
					<UInput v-model="profile.username" placeholder="Enter username" class="w-full sm:w-96" />
				</UFormField>

				<UFormField
					name="display_name"
					label="Display Name"
					description="Shown publicly. Leave empty to use username."
					class="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0 max-sm:flex-col"
					:ui="{ root: 'w-full sm:w-auto', container: 'w-full sm:w-auto' }"
				>
					<UInput
						v-model="profile.display_name"
						placeholder="Enter display name"
						class="w-full sm:w-96"
					/>
				</UFormField>

				<UFormField
					name="email"
					label="Email"
					description="Used to sign in and for notifications."
					required
					class="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0 max-sm:flex-col"
					:ui="{ root: 'w-full sm:w-auto', container: 'w-full sm:w-auto' }"
				>
					<UInput
						v-model="profile.email"
						type="email"
						placeholder="Enter email"
						class="w-full sm:w-96"
					/>
				</UFormField>

				<UFormField
					name="current_password"
					label="Current Password"
					description="Enter your current password to confirm changes."
					required
					class="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0 max-sm:flex-col"
					:ui="{ root: 'w-full sm:w-auto', container: 'w-full sm:w-auto' }"
				>
					<UInput
						v-model="profile.current_password"
						type="password"
						placeholder="Enter current password"
						class="w-full sm:w-96"
					/>
				</UFormField>

				<div class="pt-4">
					<UButton
						label="Save Changes"
						color="primary"
						type="submit"
						:loading="loading"
						icon="i-lucide-save"
					/>
				</div>
			</UForm>
		</DashboardSectionCard>

		<!-- Account summary -->
		<div class="rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
			<div class="flex items-center gap-4">
				<div
					class="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-primary-500 to-blue-600"
				>
					<span class="text-xl font-bold text-white">
						{{ userInfo.display_name?.charAt(0) || userInfo.username.charAt(0) || "?" }}
					</span>
				</div>
				<div>
					<p class="font-medium text-white">{{ userInfo.display_name || userInfo.username }}</p>
					<p class="text-sm text-slate-400">@{{ userInfo.username }}</p>
				</div>
				<div class="ml-auto">
					<UBadge :label="userInfo.role" :color="getRoleColor(userInfo.role)" variant="soft" />
				</div>
			</div>
		</div>
	</div>
</template>
