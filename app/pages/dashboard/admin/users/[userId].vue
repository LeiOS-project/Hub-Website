<script setup lang="ts">
import type { BreadcrumbItem, FormError, FormSubmitEvent } from "@nuxt/ui";
import * as z from "zod";
import { zPostAdminUsersByUserIdSuspendBody } from "~/api-client/zod.gen";
import { useUserInfoStore } from "~/composables/stores/useUserStore";
import type { AdminPasswordResetLink, AdminUser, AdminUserPublisher } from "~/utils/adminTypes";

definePageMeta({
	layout: "dashboard",
});

const route = useRoute();
const toast = useToast();

const userId = Number(route.params.userId);
if (!Number.isInteger(userId) || userId <= 0) {
	throw createError({ statusCode: 404, statusMessage: "User not found" });
}

const currentUser = await useUserInfoStore().use();
const currentUserId = computed(() => currentUser.value?.id);
const isSelf = computed(() => currentUserId.value === userId);
// Moderators can look users up and suspend regular accounts; account administration is for admins.
const isAdmin = computed(() => currentUser.value?.role === "admin");

const { data: result, refresh: refreshUser } = await useAPIAsyncData(
	`admin-user:${userId}`,
	async () => await useAPI((api) => api.getAdminUsersByUserId({ path: { userId } })),
);

const user = computed<AdminUser | null>(() => (result.value?.success ? result.value.data : null));

const error = computed(() => {
	const res = result.value;
	if (!res || res.success) return null;
	return createError({
		statusCode: res.code || 500,
		statusMessage: res.message || "Failed to load the user",
	});
});

useSeoMeta({
	title: () => `${user.value?.username ?? `User #${userId}`} | Users | LeiOS Hub`,
	description: () => `Manage the account ${user.value?.username ?? `#${userId}`} on LeiOS Hub`,
});

const breadcrumbItems = computed<BreadcrumbItem[]>(() => [
	{ label: "Users", to: "/dashboard/admin/users" },
	{ label: user.value?.username ?? `#${userId}` },
]);

const {
	data: memberships,
	loading: membershipsLoading,
	refresh: refreshMemberships,
} = await useAPILazyAsyncData<AdminUserPublisher[] | null>(
	`admin-user:${userId}:publishers`,
	async () => {
		const res = await useAPI((api) => api.getAdminUsersByUserIdPublishers({ path: { userId } }));
		if (!res.success) {
			toast.add({ title: "Failed to load publishers", description: res.message, color: "error" });
			return null;
		}
		return res.data;
	},
);

const ownedPublishers = computed(() => (memberships.value ?? []).filter((p) => p.is_owner));

const targetAuditTable = useTemplateRef<{ refresh: () => Promise<void> }>("targetAuditTable");
const actorAuditTable = useTemplateRef<{ refresh: () => Promise<void> }>("actorAuditTable");

/** Reload the user and the activity on it after an action (every action is audit-logged). */
async function reloadAfterAction() {
	await Promise.all([refreshUser(), targetAuditTable.value?.refresh()]);
}

function toastError(title: string, message: string) {
	toast.add({ title, description: message, icon: "i-lucide-circle-alert", color: "error" });
}

// Which quick action (no modal) is running, for the button spinners.
const busyAction = ref<"verify-email" | "unsuspend" | "revoke-sessions" | null>(null);

// --- Edit -----------------------------------------------------------------------------------

const showEditModal = ref(false);

// --- Set password ---------------------------------------------------------------------------

const passwordModalOpen = ref(false);
const passwordSaving = ref(false);

// Mirrors the API's rules (zPutAdminUsersByUserIdPasswordBody) with readable messages.
const passwordSchema = z.object({
	password: z
		.string()
		.min(8, "Use at least 8 characters")
		.max(50, "Use at most 50 characters")
		.regex(
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/,
			"Use upper- and lower-case letters, a digit and a symbol",
		),
	confirm_password: z.string(),
});
type PasswordSchema = z.output<typeof passwordSchema>;

const passwordForm = reactive<PasswordSchema>({ password: "", confirm_password: "" });

function validatePassword(state: Partial<PasswordSchema>): FormError[] {
	const errors: FormError[] = [];
	if (state.password && state.confirm_password && state.password !== state.confirm_password) {
		errors.push({ name: "confirm_password", message: "Passwords do not match" });
	}
	return errors;
}

watch(passwordModalOpen, (open) => {
	if (open) {
		passwordForm.password = "";
		passwordForm.confirm_password = "";
	}
});

async function submitPassword(event: FormSubmitEvent<PasswordSchema>) {
	passwordSaving.value = true;
	const res = await useAPI((api) =>
		api.putAdminUsersByUserIdPassword({
			path: { userId },
			body: { password: event.data.password },
		}),
	);
	passwordSaving.value = false;

	if (!res.success) {
		toastError("Failed to set the password", res.message);
		return;
	}

	toast.add({
		title: "Password updated",
		description: "The user has been signed out of all sessions.",
		icon: "i-lucide-check",
		color: "success",
	});
	passwordModalOpen.value = false;
	await reloadAfterAction();
}

// --- Password reset link --------------------------------------------------------------------

const resetLinkModalOpen = ref(false);
const resetLinkSendEmail = ref(false);
const resetLinkCreating = ref(false);
const resetLink = ref<AdminPasswordResetLink | null>(null);
const resetLinkEmailRequested = ref(false);

watch(resetLinkModalOpen, (open) => {
	if (!open) {
		resetLink.value = null;
		resetLinkSendEmail.value = false;
	}
});

async function createResetLink() {
	resetLinkCreating.value = true;
	const sendEmail = resetLinkSendEmail.value;
	const res = await useAPI((api) =>
		api.postAdminUsersByUserIdPasswordResetLink({
			path: { userId },
			body: { send_email: sendEmail },
		}),
	);
	resetLinkCreating.value = false;

	if (!res.success) {
		toastError("Failed to create the link", res.message);
		return;
	}

	resetLink.value = res.data;
	resetLinkEmailRequested.value = sendEmail;
	await targetAuditTable.value?.refresh();
}

async function copyResetLink() {
	if (!resetLink.value) return;
	try {
		await navigator.clipboard.writeText(resetLink.value.reset_url);
		toast.add({ title: "Link copied", icon: "i-lucide-check", color: "success" });
	} catch {
		toastError("Copy failed", "The browser did not allow access to the clipboard.");
	}
}

// --- Sign out everywhere --------------------------------------------------------------------

const revokeModalOpen = ref(false);

async function revokeSessions() {
	busyAction.value = "revoke-sessions";
	const res = await useAPI((api) => api.postAdminUsersByUserIdRevokeSessions({ path: { userId } }));
	busyAction.value = null;

	if (!res.success) {
		toastError("Failed to sign the user out", res.message);
		return;
	}

	toast.add({
		title: "Signed out everywhere",
		description: "All sessions ended and all API keys deleted.",
		icon: "i-lucide-check",
		color: "success",
	});
	revokeModalOpen.value = false;
	await reloadAfterAction();
}

// --- Email confirmation ---------------------------------------------------------------------

async function markEmailConfirmed() {
	busyAction.value = "verify-email";
	const res = await useAPI((api) => api.postAdminUsersByUserIdVerifyEmail({ path: { userId } }));
	busyAction.value = null;

	if (!res.success) {
		toastError("Failed to confirm the email", res.message);
		await refreshUser(); // e.g. confirmed in the meantime
		return;
	}

	toast.add({ title: "Email marked as confirmed", icon: "i-lucide-check", color: "success" });
	await reloadAfterAction();
}

// --- Suspension -----------------------------------------------------------------------------

const suspendModalOpen = ref(false);
const suspending = ref(false);

// Referenced here (not only in the template) so Biome keeps it a value import.
const suspendSchema = zPostAdminUsersByUserIdSuspendBody;
type SuspendSchema = z.output<typeof suspendSchema>;

const suspendForm = reactive<SuspendSchema>({ reason: "" });

watch(suspendModalOpen, (open) => {
	if (open) suspendForm.reason = "";
});

async function submitSuspend(event: FormSubmitEvent<SuspendSchema>) {
	suspending.value = true;
	const res = await useAPI((api) =>
		api.postAdminUsersByUserIdSuspend({ path: { userId }, body: { reason: event.data.reason } }),
	);
	suspending.value = false;

	if (!res.success) {
		toastError("Failed to suspend the user", res.message);
		return;
	}

	toast.add({ title: "User suspended", icon: "i-lucide-check", color: "success" });
	suspendModalOpen.value = false;
	await reloadAfterAction();
}

async function liftSuspension() {
	busyAction.value = "unsuspend";
	const res = await useAPI((api) => api.postAdminUsersByUserIdUnsuspend({ path: { userId } }));
	busyAction.value = null;

	if (!res.success) {
		toastError("Failed to lift the suspension", res.message);
		await refreshUser();
		return;
	}

	toast.add({ title: "Suspension lifted", icon: "i-lucide-check", color: "success" });
	await reloadAfterAction();
}

// --- Delete ---------------------------------------------------------------------------------

const deleteConfirmOpen = ref(false);

const deleteBlockedReason = computed(() => {
	if (isSelf.value) return "Delete your own account from your account settings instead.";
	if (ownedPublishers.value.length > 0) {
		const names = ownedPublishers.value.map((p) => p.name).join(", ");
		return `Owns ${ownedPublishers.value.length === 1 ? "the publisher" : "the publishers"} ${names}. Transfer the ownership first.`;
	}
	return null;
});

async function onDeleteUser() {
	const res = await useAPI((api) => api.deleteAdminUsersByUserId({ path: { userId } }));
	if (!res.success) {
		toastError("Delete failed", res.message);
		// Throwing keeps the delete modal open (see DashboardDeleteModal).
		throw new Error(res.message);
	}

	toast.add({ title: "User deleted", icon: "i-lucide-check", color: "success" });
	await navigateTo("/dashboard/admin/users");
}

async function refreshPage() {
	await Promise.all([
		refreshUser(),
		refreshMemberships(),
		targetAuditTable.value?.refresh(),
		actorAuditTable.value?.refresh(),
	]);
}
</script>

<template>
	<UDashboardPanel>
		<template #header>
			<DashboardPageHeader icon="i-lucide-user" :breadcrumb-items="breadcrumbItems">
				<template #right>
					<UButton
						icon="i-lucide-refresh-cw"
						color="neutral"
						variant="subtle"
						aria-label="Refresh"
						@click="refreshPage();"
					/>
				</template>
			</DashboardPageHeader>
		</template>

		<template #body>
			<UError v-if="error" :error="error" />

			<DashboardPageBody v-else-if="user">
				<!-- Suspension banner -->
				<UAlert
					v-if="user.status === 'suspended'"
					color="error"
					variant="subtle"
					icon="i-lucide-ban"
					title="This account is suspended"
					:description="`Since ${formatDate(user.suspended_at)} — ${user.suspended_reason || 'no reason given'}. The user cannot sign in.`"
				>
					<template #actions>
						<UButton
							label="Lift suspension"
							color="neutral"
							variant="subtle"
							size="sm"
							icon="i-lucide-unlock"
							:loading="busyAction === 'unsuspend'"
							@click="liftSuspension();"
						/>
					</template>
				</UAlert>

				<div class="grid gap-6 xl:grid-cols-3">
					<div class="space-y-6 xl:col-span-2">
						<!-- Profile -->
						<DashboardSectionCard title="Profile" description="Account details" icon="i-lucide-user">
							<template #actions>
								<UButton
									v-if="isAdmin"
									label="Edit"
									icon="i-lucide-pencil"
									color="neutral"
									variant="subtle"
									size="sm"
									@click="showEditModal = true;"
								/>
							</template>

							<div class="flex flex-col gap-6 sm:flex-row sm:items-start">
								<Gravatar
									:key="user.email"
									:email="user.email"
									:alt="user.display_name"
									size="3xl"
									class="shrink-0"
								/>

								<div class="min-w-0 flex-1 divide-y divide-slate-800">
									<AdminDetailRow label="Display name">
										<span class="font-medium text-white">{{ user.display_name }}</span>
									</AdminDetailRow>
									<AdminDetailRow label="Username">
										<span class="font-mono">{{ user.username }}</span>
									</AdminDetailRow>
									<AdminDetailRow label="User ID">
										<span class="font-mono text-slate-400">#{{ user.id }}</span>
									</AdminDetailRow>
									<AdminDetailRow label="Email">
										<div class="flex flex-wrap items-center gap-2 sm:justify-end">
											<span class="break-all">{{ user.email }}</span>
											<UBadge
												v-if="user.email_verified_at"
												color="success"
												variant="soft"
												size="sm"
												icon="i-lucide-mail-check"
											>
												Confirmed
											</UBadge>
											<UBadge v-else color="warning" variant="soft" size="sm" icon="i-lucide-mail-warning">
												Unconfirmed
											</UBadge>
										</div>
									</AdminDetailRow>
									<AdminDetailRow v-if="user.email_verified_at" label="Email confirmed">
										{{ formatDate(user.email_verified_at) }}
									</AdminDetailRow>
									<AdminDetailRow label="Role">
										<UBadge :color="getRoleColor(user.role)" variant="soft" class="capitalize">
											{{ user.role }}
										</UBadge>
									</AdminDetailRow>
									<AdminDetailRow label="Status">
										<AdminStatusBadge :status="user.status" />
									</AdminDetailRow>
									<AdminDetailRow label="Joined">
										{{ formatDate(user.created_at) }}
									</AdminDetailRow>
								</div>
							</div>
						</DashboardSectionCard>

						<!-- Publishers -->
						<DashboardSectionCard
							title="Publishers"
							description="Publishers this user owns or is a member of"
							icon="i-lucide-building-2"
							flush
						>
							<div v-if="membershipsLoading && !memberships" class="flex justify-center py-8">
								<UIcon name="i-lucide-loader-2" class="animate-spin text-2xl text-slate-400" />
							</div>
							<UEmpty
								v-else-if="!memberships?.length"
								icon="i-lucide-building-2"
								title="No publishers"
								description="This user is not a member of any publisher."
								variant="naked"
								size="sm"
							/>
							<ul v-else class="divide-y divide-slate-800">
								<li
									v-for="publisher in memberships"
									:key="publisher.id"
									class="flex flex-wrap items-center justify-between gap-3 px-6 py-3"
								>
									<div class="min-w-0">
										<div class="flex items-center gap-2">
											<NuxtLink
												:to="`/dashboard/publishers/${publisher.name}`"
												class="truncate font-medium text-white hover:underline"
											>
												{{ publisher.display_name }}
											</NuxtLink>
											<UTooltip v-if="publisher.verified_at" text="Verified publisher">
												<UIcon name="i-lucide-badge-check" class="size-4 text-primary-400" />
											</UTooltip>
										</div>
										<p class="truncate font-mono text-xs text-slate-400">{{ publisher.name }}</p>
									</div>
									<div class="flex items-center gap-2">
										<UBadge v-if="publisher.is_owner" color="warning" variant="soft" size="sm">
											Owner
										</UBadge>
										<UBadge color="neutral" variant="soft" size="sm">{{ publisher.role }}</UBadge>
										<UButton
											:to="`/dashboard/publishers/${publisher.name}`"
											icon="i-lucide-settings"
											color="neutral"
											variant="ghost"
											size="xs"
											aria-label="Manage publisher"
										/>
									</div>
								</li>
							</ul>
						</DashboardSectionCard>
					</div>

					<div class="space-y-6">
						<!-- Actions -->
						<DashboardSectionCard
							title="Account Actions"
							description="Changes are recorded in the audit log"
							icon="i-lucide-shield"
							flush
						>
							<ul class="divide-y divide-slate-800">
								<li v-if="isAdmin" class="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
									<div class="min-w-0 flex-1">
										<p class="font-medium text-white">Profile & role</p>
										<p class="text-sm text-slate-400">Username, display name, email, site role.</p>
									</div>
									<UButton
										label="Edit"
										icon="i-lucide-pencil"
										color="neutral"
										variant="subtle"
										@click="showEditModal = true;"
									/>
								</li>
								<li v-if="isAdmin" class="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
									<div class="min-w-0 flex-1">
										<p class="font-medium text-white">Password</p>
										<p class="text-sm text-slate-400">Set a new one; signs the user out everywhere.</p>
									</div>
									<UButton
										label="Set password"
										icon="i-lucide-key-round"
										color="neutral"
										variant="subtle"
										@click="passwordModalOpen = true;"
									/>
								</li>
								<li v-if="isAdmin" class="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
									<div class="min-w-0 flex-1">
										<p class="font-medium text-white">Password reset link</p>
										<p class="text-sm text-slate-400">A one-time link, valid for 24 hours.</p>
									</div>
									<UButton
										label="Create link"
										icon="i-lucide-link"
										color="neutral"
										variant="subtle"
										@click="resetLinkModalOpen = true;"
									/>
								</li>
								<li v-if="isAdmin" class="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
									<div class="min-w-0 flex-1">
										<p class="font-medium text-white">Sessions & API keys</p>
										<p class="text-sm text-slate-400">End every session and delete all API keys.</p>
									</div>
									<UButton
										label="Sign out everywhere"
										icon="i-lucide-log-out"
										color="neutral"
										variant="subtle"
										@click="revokeModalOpen = true;"
									/>
								</li>
								<li
									v-if="isAdmin && !user.email_verified_at"
									class="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
								>
									<div class="min-w-0 flex-1">
										<p class="font-medium text-white">Email confirmation</p>
										<p class="text-sm text-slate-400">
											Confirm the address for the user, e.g. when the email cannot reach them.
										</p>
									</div>
									<UButton
										label="Mark confirmed"
										icon="i-lucide-mail-check"
										color="neutral"
										variant="subtle"
										:loading="busyAction === 'verify-email'"
										@click="markEmailConfirmed();"
									/>
								</li>
								<li class="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
									<div class="min-w-0 flex-1">
										<p class="font-medium text-white">Suspension</p>
										<p class="text-sm text-slate-400">
											{{
												user.status === "suspended"
													? "Allow the user to sign in again."
													: isSelf
														? "You cannot suspend your own account."
														: "Block sign-in and end all sessions and API keys."
											}}
										</p>
									</div>
									<UButton
										v-if="user.status === 'suspended'"
										label="Lift suspension"
										icon="i-lucide-unlock"
										color="success"
										variant="soft"
										:loading="busyAction === 'unsuspend'"
										@click="liftSuspension();"
									/>
									<UButton
										v-else
										label="Suspend"
										icon="i-lucide-ban"
										color="warning"
										variant="soft"
										:disabled="isSelf || (!isAdmin && isStaffRole(user.role))"
										@click="suspendModalOpen = true;"
									/>
								</li>
							</ul>
						</DashboardSectionCard>

						<!-- Danger zone -->
						<DashboardSectionCard
							v-if="isAdmin"
							title="Danger Zone"
							description="Irreversible and destructive actions"
							icon="i-lucide-alert-triangle"
							tone="danger"
						>
							<div class="flex flex-col gap-4">
								<div>
									<h4 class="font-medium text-white">Delete User</h4>
									<p class="mt-1 text-sm text-slate-400">
										Permanently delete this account. Its publisher memberships and package roles
										are removed; the publishers and packages stay.
									</p>
									<p v-if="deleteBlockedReason" class="mt-2 text-sm text-amber-400">
										{{ deleteBlockedReason }}
									</p>
								</div>
								<UButton
									label="Delete User"
									color="error"
									variant="soft"
									icon="i-lucide-trash-2"
									class="self-start"
									:disabled="!!deleteBlockedReason"
									@click="deleteConfirmOpen = true;"
								/>
							</div>
						</DashboardSectionCard>
					</div>
				</div>

				<!-- Activity -->
				<AdminAuditLogTable
					ref="targetAuditTable"
					title="Activity on this Account"
					description="Everything recorded about this user"
					target-type="user"
					:target-id="String(userId)"
					:default-page-size="10"
					empty-description="Nothing has been recorded about this account yet."
				>
					<template #actions>
						<UButton
							label="Audit log"
							trailing-icon="i-lucide-arrow-right"
							color="neutral"
							variant="ghost"
							size="sm"
							:to="`/dashboard/admin/audit-log?target_type=user&target_id=${userId}`"
						/>
					</template>
				</AdminAuditLogTable>

				<AdminAuditLogTable
					ref="actorAuditTable"
					title="Actions by this User"
					description="What this user did on the hub"
					:actor-user-id="userId"
					:default-page-size="10"
					hide-actor
					empty-description="This user has no recorded actions."
				>
					<template #actions>
						<UButton
							label="Audit log"
							trailing-icon="i-lucide-arrow-right"
							color="neutral"
							variant="ghost"
							size="sm"
							:to="`/dashboard/admin/audit-log?actor_user_id=${userId}`"
						/>
					</template>
				</AdminAuditLogTable>
			</DashboardPageBody>
		</template>
	</UDashboardPanel>

	<template v-if="user">
		<AdminUserEditModal
			v-model:open="showEditModal"
			:user="user"
			:current-user-id="currentUserId"
			@saved="reloadAfterAction()"
		/>

		<!-- Set password -->
		<DashboardModal
			v-model:open="passwordModalOpen"
			:title="`Set Password: ${user.username}`"
			description="The user is signed out of all sessions"
			icon="i-lucide-key-round"
			icon-color="amber"
		>
			<UForm
				id="admin-user-password-form"
				:schema="passwordSchema"
				:validate="validatePassword"
				:state="passwordForm"
				class="space-y-4"
				@submit="submitPassword"
			>
				<UFormField label="New password" name="password" required>
					<UInput
						v-model="passwordForm.password"
						type="password"
						autocomplete="new-password"
						class="w-full"
					/>
				</UFormField>
				<UFormField label="Confirm password" name="confirm_password" required>
					<UInput
						v-model="passwordForm.confirm_password"
						type="password"
						autocomplete="new-password"
						class="w-full"
					/>
				</UFormField>
			</UForm>

			<template #footer>
				<div class="flex justify-end gap-2">
					<UButton label="Cancel" color="neutral" variant="ghost" @click="passwordModalOpen = false;" />
					<UButton
						type="submit"
						form="admin-user-password-form"
						label="Set password"
						icon="i-lucide-save"
						:loading="passwordSaving"
					/>
				</div>
			</template>
		</DashboardModal>

		<!-- Password reset link -->
		<DashboardModal
			v-model:open="resetLinkModalOpen"
			title="Password Reset Link"
			description="A one-time link to choose a new password, valid for 24 hours"
			icon="i-lucide-link"
		>
			<div v-if="!resetLink" class="space-y-4">
				<p class="text-sm text-slate-300">
					Creating a link replaces any earlier reset link of
					<span class="font-medium text-white">{{ user.username }}</span>.
				</p>
				<UCheckbox
					v-model="resetLinkSendEmail"
					:label="`Also email it to ${user.email}`"
					description="Needs email to be configured on the API server."
				/>
			</div>

			<div v-else class="space-y-4">
				<UFormField label="Reset link" :help="`Valid until ${formatDate(resetLink.expires_at)}.`">
					<div class="flex gap-2">
						<UInput :model-value="resetLink.reset_url" readonly class="w-full font-mono" />
						<UButton
							icon="i-lucide-copy"
							color="neutral"
							variant="subtle"
							aria-label="Copy link"
							@click="copyResetLink();"
						/>
					</div>
				</UFormField>

				<UAlert
					v-if="resetLink.emailed"
					color="success"
					variant="subtle"
					icon="i-lucide-mail-check"
					:title="`Emailed to ${user.email}`"
				/>
				<UAlert
					v-else-if="resetLinkEmailRequested"
					color="warning"
					variant="subtle"
					icon="i-lucide-mail-x"
					title="The link was not emailed"
					description="Email is not configured on the API server. Hand the link to the user yourself."
				/>
				<p v-else class="text-sm text-slate-400">
					Hand the link to the user over a channel you trust. Anyone with it can set the password.
				</p>
			</div>

			<template #footer>
				<div class="flex justify-end gap-2">
					<UButton
						:label="resetLink ? 'Done' : 'Cancel'"
						color="neutral"
						variant="ghost"
						@click="resetLinkModalOpen = false;"
					/>
					<UButton
						v-if="!resetLink"
						label="Create link"
						icon="i-lucide-link"
						:loading="resetLinkCreating"
						@click="createResetLink();"
					/>
				</div>
			</template>
		</DashboardModal>

		<!-- Sign out everywhere -->
		<DashboardModal
			v-model:open="revokeModalOpen"
			title="Sign Out Everywhere"
			:description="`End all sessions of ${user.username}`"
			icon="i-lucide-log-out"
			icon-color="amber"
		>
			<div class="space-y-3 text-sm text-slate-300">
				<p>
					This ends every session and <span class="font-medium text-white">deletes all API keys</span>
					of the account. Scripts and CI jobs using those keys stop working.
				</p>
				<UAlert
					v-if="isSelf"
					color="warning"
					variant="subtle"
					icon="i-lucide-triangle-alert"
					title="This is your own account"
					description="Your current session ends too; you will have to sign in again."
				/>
			</div>

			<template #footer>
				<div class="flex justify-end gap-2">
					<UButton label="Cancel" color="neutral" variant="ghost" @click="revokeModalOpen = false;" />
					<UButton
						label="Sign out everywhere"
						icon="i-lucide-log-out"
						color="warning"
						:loading="busyAction === 'revoke-sessions'"
						@click="revokeSessions();"
					/>
				</div>
			</template>
		</DashboardModal>

		<!-- Suspend -->
		<DashboardModal
			v-model:open="suspendModalOpen"
			:title="`Suspend ${user.username}`"
			description="The user cannot sign in until the suspension is lifted"
			icon="i-lucide-ban"
			icon-color="error"
		>
			<UForm
				id="admin-user-suspend-form"
				:schema="suspendSchema"
				:state="suspendForm"
				class="space-y-4"
				@submit="submitSuspend"
			>
				<p class="text-sm text-slate-300">
					Suspending ends all sessions and deletes all API keys. Publishers and packages the user
					owns stay as they are.
				</p>
				<UFormField
					label="Reason"
					name="reason"
					required
					help="Recorded with the suspension and in the audit log."
				>
					<UTextarea
						v-model="suspendForm.reason"
						:rows="3"
						:maxlength="500"
						autoresize
						placeholder="e.g. Uploaded malware in example.package"
						class="w-full"
					/>
				</UFormField>
			</UForm>

			<template #footer>
				<div class="flex justify-end gap-2">
					<UButton label="Cancel" color="neutral" variant="ghost" @click="suspendModalOpen = false;" />
					<UButton
						type="submit"
						form="admin-user-suspend-form"
						label="Suspend"
						icon="i-lucide-ban"
						color="error"
						:loading="suspending"
					/>
				</div>
			</template>
		</DashboardModal>

		<DashboardDeleteModal
			v-model:open="deleteConfirmOpen"
			title="Delete User"
			:warning-text="`This permanently deletes the account “${user.username}” with its sessions and API keys. This cannot be undone.`"
			:on-delete="onDeleteUser"
		/>
	</template>
</template>
