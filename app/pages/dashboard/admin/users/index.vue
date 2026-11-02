<script setup lang="ts">
import type { DropdownMenuItem, FormSubmitEvent, TableColumn } from "@nuxt/ui";
import { watchDebounced } from "@vueuse/core";
import type { z } from "zod";
import { zPostAdminUsersBody } from "~/api-client/zod.gen";
import { useUserInfoStore } from "~/composables/stores/useUserStore";
import type { AdminPage, AdminUser, AdminUserRole, AdminUserStatus } from "~/utils/adminTypes";

definePageMeta({
	layout: "dashboard",
});

useSeoMeta({
	title: "Users | LeiOS Hub",
	description: "Manage users",
});

const toast = useToast();
const route = useRoute();
const router = useRouter();

const currentUser = await useUserInfoStore().use();
const currentUserId = computed(() => currentUser.value?.id);

const ROLE_ITEMS: { label: string; value: AdminUserRole | "all" }[] = [
	{ label: "All roles", value: "all" },
	{ label: "Admin", value: "admin" },
	{ label: "Moderator", value: "moderator" },
	{ label: "Developer", value: "developer" },
	{ label: "User", value: "user" },
];

const STATUS_ITEMS: { label: string; value: AdminUserStatus | "all" }[] = [
	{ label: "All statuses", value: "all" },
	{ label: "Active", value: "active" },
	{ label: "Suspended", value: "suspended" },
];

const VERIFIED_ITEMS: { label: string; value: "all" | "true" | "false" }[] = [
	{ label: "Any email status", value: "all" },
	{ label: "Email confirmed", value: "true" },
	{ label: "Email unconfirmed", value: "false" },
];

// Initial filters come from the URL so filtered views can be linked and survive a reload.
const filters = reactive({
	search: typeof route.query.search === "string" ? route.query.search : "",
	role: ROLE_ITEMS.find((i) => i.value === route.query.role)?.value ?? "all",
	status: STATUS_ITEMS.find((i) => i.value === route.query.status)?.value ?? "all",
	verified: VERIFIED_ITEMS.find((i) => i.value === route.query.verified)?.value ?? "all",
});

const page = ref(1);
const pageSize = ref(25);

const {
	data: usersPage,
	loading,
	refresh,
} = await useAPILazyAsyncData<AdminPage<AdminUser>>("admin-users-list", async () => {
	const search = filters.search.trim();
	const res = await useAPI((api) =>
		api.getAdminUsers({
			query: {
				search: search || undefined,
				role: filters.role === "all" ? undefined : filters.role,
				status: filters.status === "all" ? undefined : filters.status,
				verified: filters.verified === "all" ? undefined : filters.verified,
				limit: pageSize.value,
				offset: (page.value - 1) * pageSize.value,
			},
		}),
	);

	if (!res.success) {
		toast.add({ title: "Failed to load users", description: res.message, color: "error" });
		return { items: [], total: 0 };
	}

	// The page ran past the end (e.g. after a delete): jump to the last page.
	if (res.data.items.length === 0 && res.data.total > 0 && page.value > 1) {
		page.value = Math.ceil(res.data.total / pageSize.value);
	}
	return res.data;
});

function reloadFromFirstPage() {
	router.replace({
		query: {
			search: filters.search.trim() || undefined,
			role: filters.role === "all" ? undefined : filters.role,
			status: filters.status === "all" ? undefined : filters.status,
			verified: filters.verified === "all" ? undefined : filters.verified,
		},
	});

	if (page.value !== 1) {
		page.value = 1; // the page watcher reloads
	} else {
		refresh();
	}
}

watch(page, () => refresh());
watch(pageSize, reloadFromFirstPage);
watch(() => [filters.role, filters.status, filters.verified], reloadFromFirstPage);
watchDebounced(() => filters.search, reloadFromFirstPage, { debounce: 300 });

const hasActiveFilters = computed(
	() =>
		filters.search.trim() !== "" ||
		filters.role !== "all" ||
		filters.status !== "all" ||
		filters.verified !== "all",
);

function resetFilters() {
	filters.search = "";
	filters.role = "all";
	filters.status = "all";
	filters.verified = "all";
}

const columns: TableColumn<AdminUser>[] = [
	{ id: "user", header: "User" },
	{ accessorKey: "email", header: "Email" },
	{ accessorKey: "role", header: "Role" },
	{ accessorKey: "status", header: "Status" },
	{ accessorKey: "created_at", header: "Joined" },
	{ id: "actions", header: "", enableSorting: false, enableHiding: false },
];

// Moderators can look users up (and suspend regular ones on the details page); creating, editing
// and deleting accounts is for admins.
const isAdmin = computed(() => currentUser.value?.role === "admin");

function getRowActions(user: AdminUser): DropdownMenuItem[][] {
	const open: DropdownMenuItem = {
		label: "Open details",
		icon: "i-lucide-user-round-search",
		to: `/dashboard/admin/users/${user.id}`,
	};
	if (!isAdmin.value) return [[open]];

	return [
		[
			open,
			{
				label: "Edit",
				icon: "i-lucide-pencil",
				onSelect: () => openEdit(user),
			},
		],
		[
			{
				label: "Delete",
				icon: "i-lucide-trash-2",
				color: "error",
				disabled: user.id === currentUserId.value,
				onSelect: () => openDelete(user),
			},
		],
	];
}

// Create
const showCreateModal = ref(false);
const creating = ref(false);

// Referenced here (not only in the template) so Biome keeps it a value import.
const createSchema = zPostAdminUsersBody;
type CreateSchema = z.output<typeof createSchema>;

const CREATE_ROLE_ITEMS = ROLE_ITEMS.filter(
	(i): i is { label: string; value: AdminUserRole } => i.value !== "all",
);

const createForm = reactive<CreateSchema>({
	username: "",
	display_name: "",
	email: "",
	password: "",
	role: "developer",
});

function resetCreateForm() {
	createForm.username = "";
	createForm.display_name = "";
	createForm.email = "";
	createForm.password = "";
	createForm.role = "developer";
}

async function handleCreate(event: FormSubmitEvent<CreateSchema>) {
	creating.value = true;
	const res = await useAPI((api) => api.postAdminUsers({ body: event.data }));
	creating.value = false;

	if (!res.success) {
		toast.add({
			title: "Create failed",
			description: res.message,
			icon: "i-lucide-circle-alert",
			color: "error",
		});
		return;
	}

	toast.add({ title: "User created", icon: "i-lucide-check", color: "success" });
	showCreateModal.value = false;
	resetCreateForm();
	await refresh();
}

// Edit
const showEditModal = ref(false);
const editTarget = ref<AdminUser | null>(null);

function openEdit(user: AdminUser) {
	editTarget.value = user;
	showEditModal.value = true;
}

// Delete
const deleteConfirmOpen = ref(false);
const deleteTarget = ref<AdminUser | null>(null);

function openDelete(user: AdminUser) {
	deleteTarget.value = user;
	deleteConfirmOpen.value = true;
}

async function onDeleteUser() {
	const target = deleteTarget.value;
	if (!target) return;

	const res = await useAPI((api) => api.deleteAdminUsersByUserId({ path: { userId: target.id } }));
	if (!res.success) {
		toast.add({
			title: "Delete failed",
			description: res.message,
			icon: "i-lucide-circle-alert",
			color: "error",
		});
		// Throwing keeps the delete modal open (see DashboardDeleteModal).
		throw new Error(res.message);
	}

	toast.add({ title: "User deleted", icon: "i-lucide-check", color: "success" });
	deleteTarget.value = null;
	await refresh();
}
</script>

<template>
	<UDashboardPanel>
		<template #header>
			<DashboardPageHeader title="Users" icon="i-lucide-users" description="Manage users">
				<template #right>
					<UButton
						v-if="isAdmin"
						label="New User"
						icon="i-lucide-user-plus"
						color="primary"
						@click="showCreateModal = true;"
					/>
				</template>
			</DashboardPageHeader>
		</template>

		<template #body>
			<DashboardPageBody>
				<DashboardDataTable
					:data="usersPage?.items ?? []"
					:columns="columns"
					:loading="loading"
					:default-page-size="100"
					:empty-title="hasActiveFilters ? 'No matching users' : 'No users'"
					:empty-description="
						hasActiveFilters ? 'Try other filters.' : 'Create the first user to get started.'
					"
					empty-icon="i-lucide-users"
					@refresh="refresh()"
				>
					<template #header-left>
						<UInput
							v-model="filters.search"
							icon="i-lucide-search"
							placeholder="Search name, username or email..."
							:maxlength="64"
							class="w-full sm:w-auto sm:min-w-64"
						/>
						<USelect v-model="filters.role" :items="ROLE_ITEMS" class="w-full sm:w-auto sm:min-w-36" />
						<USelect
							v-model="filters.status"
							:items="STATUS_ITEMS"
							class="w-full sm:w-auto sm:min-w-36"
						/>
						<USelect
							v-model="filters.verified"
							:items="VERIFIED_ITEMS"
							class="w-full sm:w-auto sm:min-w-44"
						/>
						<UButton
							v-if="hasActiveFilters"
							label="Reset"
							icon="i-lucide-x"
							color="neutral"
							variant="ghost"
							@click="resetFilters();"
						/>
					</template>

					<template #user-cell="{ row }">
						<NuxtLink
							:to="`/dashboard/admin/users/${row.original.id}`"
							class="group flex min-w-0 items-center gap-3"
						>
							<Gravatar
								:key="row.original.id"
								:email="row.original.email"
								:alt="row.original.display_name"
								size="sm"
							/>
							<div class="min-w-0">
								<p class="truncate font-medium text-white group-hover:underline">
									{{ row.original.display_name }}
								</p>
								<p class="truncate font-mono text-xs text-slate-400">
									{{ row.original.username }} · #{{ row.original.id }}
								</p>
							</div>
						</NuxtLink>
					</template>

					<template #email-cell="{ row }">
						<div class="flex items-center gap-2">
							<span class="text-slate-300">{{ row.original.email }}</span>
							<UTooltip
								v-if="row.original.email_verified_at"
								:text="`Confirmed ${formatDate(row.original.email_verified_at)}`"
							>
								<UIcon name="i-lucide-mail-check" class="size-4 shrink-0 text-emerald-400" />
							</UTooltip>
							<UBadge v-else color="warning" variant="soft" size="sm">Unconfirmed</UBadge>
						</div>
					</template>

					<template #role-cell="{ row }">
						<UBadge :color="getRoleColor(row.original.role)" variant="soft" class="capitalize">
							{{ row.original.role }}
						</UBadge>
					</template>

					<template #status-cell="{ row }">
						<UTooltip
							v-if="row.original.status === 'suspended'"
							:text="row.original.suspended_reason || 'No reason given'"
						>
							<AdminStatusBadge status="suspended" />
						</UTooltip>
						<AdminStatusBadge v-else :status="row.original.status" />
					</template>

					<template #created_at-cell="{ row }">
						<span class="whitespace-nowrap text-sm text-slate-400">
							{{ formatDate(row.original.created_at) }}
						</span>
					</template>

					<template #actions-cell="{ row }">
						<div class="flex justify-end gap-1">
							<UTooltip text="Open details">
								<UButton
									:to="`/dashboard/admin/users/${row.original.id}`"
									icon="i-lucide-eye"
									color="neutral"
									variant="ghost"
									size="xs"
								/>
							</UTooltip>
							<UDropdownMenu
								:ui="{ viewport: 'main-bg-color' }"
								:items="getRowActions(row.original)"
							>
								<UButton
									icon="i-lucide-more-horizontal"
									color="neutral"
									variant="ghost"
									size="xs"
								/>
							</UDropdownMenu>
						</div>
					</template>

					<template #empty-actions>
						<UButton
							v-if="hasActiveFilters"
							label="Reset filters"
							color="neutral"
							variant="subtle"
							@click="resetFilters();"
						/>
						<UButton
							v-else-if="isAdmin"
							label="Create User"
							color="primary"
							@click="showCreateModal = true;"
						/>
					</template>

					<template #footer-left>
						<AdminPageSizeSelect
							v-model:page-size="pageSize"
							:page="page"
							:total="usersPage?.total ?? 0"
						/>
					</template>

					<template #footer-right>
						<UPagination
							v-model:page="page"
							:total="usersPage?.total ?? 0"
							:items-per-page="pageSize"
							:sibling-count="1"
							show-edges
						/>
					</template>
				</DashboardDataTable>
			</DashboardPageBody>
		</template>
	</UDashboardPanel>

	<!-- Create User Modal -->
	<DashboardModal
		v-model:open="showCreateModal"
		title="Create User"
		description="The account can sign in right away"
		icon="i-lucide-user-plus"
	>
		<UForm
			id="admin-user-create-form"
			:schema="createSchema"
			:state="createForm"
			class="space-y-4"
			@submit="handleCreate"
		>
			<UFormField label="Username" name="username" required>
				<UInput v-model="createForm.username" placeholder="johndoe" autocomplete="off" class="w-full" />
			</UFormField>
			<UFormField label="Display Name" name="display_name" required>
				<UInput v-model="createForm.display_name" placeholder="John Doe" class="w-full" />
			</UFormField>
			<UFormField label="Email" name="email" required>
				<UInput
					v-model="createForm.email"
					type="email"
					placeholder="john@example.com"
					class="w-full"
				/>
			</UFormField>
			<UFormField label="Password" name="password" required>
				<UInput
					v-model="createForm.password"
					type="password"
					placeholder="••••••••"
					autocomplete="new-password"
					class="w-full"
				/>
			</UFormField>
			<UFormField label="Role" name="role" required>
				<USelect v-model="createForm.role" :items="CREATE_ROLE_ITEMS" class="w-full" />
			</UFormField>
		</UForm>

		<template #footer>
			<div class="flex justify-end gap-2">
				<UButton
					label="Cancel"
					color="neutral"
					variant="ghost"
					@click="showCreateModal = false;"
				/>
				<UButton
					type="submit"
					form="admin-user-create-form"
					label="Create"
					icon="i-lucide-user-plus"
					:loading="creating"
				/>
			</div>
		</template>
	</DashboardModal>

	<AdminUserEditModal
		v-model:open="showEditModal"
		:user="editTarget"
		:current-user-id="currentUserId"
		@saved="refresh()"
	/>

	<DashboardDeleteModal
		v-model:open="deleteConfirmOpen"
		title="Delete User"
		:warning-text="`This permanently deletes the account “${deleteTarget?.username ?? ''}”. Users who still own publishers cannot be deleted — transfer the ownership first.`"
		:on-delete="onDeleteUser"
	/>
</template>
