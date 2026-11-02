<script setup lang="ts">
/**
 * Edit a user's username, display name, email and role (`PUT /admin/users/:userId`).
 * Emits `saved` after a successful update so the caller can reload.
 */
import type { FormSubmitEvent } from "@nuxt/ui";
import type { z } from "zod";
import { zPutAdminUsersByUserIdBody } from "~/api-client/zod.gen";
import type { AdminUser, AdminUserRole } from "~/utils/adminTypes";

const props = defineProps<{
	user: AdminUser | null;
	/** The signed-in admin's own id, to warn before they change their own role. */
	currentUserId?: number;
}>();

const emit = defineEmits<{
	saved: [];
}>();

const open = defineModel<boolean>("open", { required: true });

const toast = useToast();

// All fields are filled in from the user, so the form requires them (the API accepts any subset).
const editSchema = zPutAdminUsersByUserIdBody.required();
type EditSchema = z.output<typeof editSchema>;

const ROLE_ITEMS: { label: string; value: AdminUserRole }[] = [
	{ label: "Admin", value: "admin" },
	{ label: "Moderator", value: "moderator" },
	{ label: "Developer", value: "developer" },
	{ label: "User", value: "user" },
];

const state = reactive<EditSchema>({
	username: "",
	display_name: "",
	email: "",
	role: "user",
});

const saving = ref(false);

watch(
	open,
	(isOpen) => {
		if (isOpen && props.user) {
			state.username = props.user.username;
			state.display_name = props.user.display_name;
			state.email = props.user.email;
			state.role = props.user.role;
		}
	},
	{ immediate: true },
);

const demotesSelf = computed(
	() =>
		props.user !== null &&
		props.user.id === props.currentUserId &&
		props.user.role === "admin" &&
		state.role !== "admin",
);

async function onSubmit(event: FormSubmitEvent<EditSchema>) {
	const target = props.user;
	if (!target) return;

	// Send only what changed: the audit log records the submitted fields.
	const body: Partial<EditSchema> = {};
	if (event.data.username !== target.username) body.username = event.data.username;
	if (event.data.display_name !== target.display_name) body.display_name = event.data.display_name;
	if (event.data.email !== target.email) body.email = event.data.email;
	if (event.data.role !== target.role) body.role = event.data.role;

	if (Object.keys(body).length === 0) {
		open.value = false;
		return;
	}

	saving.value = true;
	const res = await useAPI((api) =>
		api.putAdminUsersByUserId({ path: { userId: target.id }, body }),
	);
	saving.value = false;

	if (!res.success) {
		toast.add({
			title: "Update failed",
			description: res.message,
			icon: "i-lucide-circle-alert",
			color: "error",
		});
		return;
	}

	toast.add({ title: "User updated", icon: "i-lucide-check", color: "success" });
	open.value = false;
	emit("saved");
}
</script>

<template>
	<DashboardModal
		v-model:open="open"
		:title="`Edit User: ${user?.username ?? ''}`"
		description="Change the profile and site role"
		icon="i-lucide-pencil"
	>
		<UForm
			id="admin-user-edit-form"
			:schema="editSchema"
			:state="state"
			class="space-y-4"
			@submit="onSubmit"
		>
			<UFormField label="Username" name="username" required>
				<UInput v-model="state.username" autocomplete="off" class="w-full" />
			</UFormField>
			<UFormField label="Display Name" name="display_name" required>
				<UInput v-model="state.display_name" class="w-full" />
			</UFormField>
			<UFormField
				label="Email"
				name="email"
				required
				help="Changing the address does not reset its confirmation."
			>
				<UInput v-model="state.email" type="email" class="w-full" />
			</UFormField>
			<UFormField label="Role" name="role" required>
				<USelect v-model="state.role" :items="ROLE_ITEMS" class="w-full" />
			</UFormField>

			<UAlert
				v-if="demotesSelf"
				color="warning"
				variant="subtle"
				icon="i-lucide-triangle-alert"
				title="You are removing your own admin role"
				description="You will lose access to the admin area as soon as you save."
			/>
		</UForm>

		<template #footer>
			<div class="flex justify-end gap-2">
				<UButton label="Cancel" color="neutral" variant="ghost" @click="open = false;" />
				<UButton
					type="submit"
					form="admin-user-edit-form"
					label="Save"
					icon="i-lucide-save"
					:loading="saving"
				/>
			</div>
		</template>
	</DashboardModal>
</template>
