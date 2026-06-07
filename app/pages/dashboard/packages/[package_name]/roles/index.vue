<script setup lang="ts">
import type { TableColumn } from '#ui/types'
import type { PackageRoleAssignment } from '~/utils/types'

definePageMeta({
    layout: 'dashboard'
});

const route = useRoute();
const toast = useToast();

const fullPackageName = route.params.package_name as string;

const roleOptions = [
    { label: 'ADMIN', value: 'ADMIN' },
    { label: 'MAINTAINER', value: 'MAINTAINER' },
    { label: 'DEVELOPER', value: 'DEVELOPER' },
    { label: 'VIEWER', value: 'VIEWER' },
];

const roleBadgeColor: Record<string, 'info' | 'success' | 'warning' | 'neutral'> = {
    ADMIN: 'info',
    MAINTAINER: 'success',
    DEVELOPER: 'warning',
    VIEWER: 'neutral',
};

const roleAssignmentsTableColumns: TableColumn<PackageRoleAssignment>[] = [
    { accessorKey: 'user_username', header: 'Username' },
    { accessorKey: 'user_display_name', header: 'Display Name' },
    { accessorKey: 'role', header: 'Role' },
    { accessorKey: 'created_at', header: 'Assigned At' },
    { accessorKey: 'actions', header: '', enableSorting: false, enableHiding: false }
];

const roleAssignments = await useAPILazyAsyncData<PackageRoleAssignment[]>(
    `/packages/${fullPackageName}/role-assignments`,
    async () => {
        const res = await useAPI((api) => api.getPackagesByFullPackageNameRoleAssignments({
            path: { fullPackageName }
        }));
        if (!res.success) {
            toast.add({ title: 'Failed to load role assignments', description: res.message, color: 'error' });
            return [];
        }
        return res.data;
    }
);

// --- User Search ---
const userSearchQuery = ref('');
const searchResults = ref<Array<{ id: number; username: string; display_name: string | null }>>([]);
const searchLoading = ref(false);
const selectedUser = ref<{ id: number; username: string; display_name: string | null } | null>(null);
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

function onUserSearchInput(value: string) {
    userSearchQuery.value = value;
    selectedUser.value = null;
    addState.user_id = 0;

    if (searchTimeout) clearTimeout(searchTimeout);

    if (value.length < 2) {
        searchResults.value = [];
        return;
    }

    searchTimeout = setTimeout(async () => {
        searchLoading.value = true;
        try {
            const res = await useAPI((api) => api.getUsersSearch({
                query: { q: value, limit: 10 }
            }));
            if (res.success) {
                searchResults.value = res.data ?? [];
            } else {
                searchResults.value = [];
            }
        } catch {
            searchResults.value = [];
        } finally {
            searchLoading.value = false;
        }
    }, 300);
}

function selectUser(user: { id: number; username: string; display_name: string | null }) {
    selectedUser.value = user;
    addState.user_id = user.id;
    userSearchQuery.value = user.display_name || user.username;
    searchResults.value = [];
}

// --- Add Role Assignment ---
const showAddModal = ref(false);
const addState = reactive({
    user_id: 0 as number,
    role: 'MAINTAINER' as 'ADMIN' | 'MAINTAINER' | 'DEVELOPER' | 'VIEWER',
});
const addSubmitting = ref(false);

function resetAddForm() {
    showAddModal.value = false;
    addState.user_id = 0;
    addState.role = 'MAINTAINER';
    userSearchQuery.value = '';
    searchResults.value = [];
    selectedUser.value = null;
}

async function onAddRoleAssignment() {
    if (!addState.user_id) {
        toast.add({ title: 'Error', description: 'Please select a user.', color: 'error' });
        return;
    }

    addSubmitting.value = true;
    try {
        const res = await useAPI((api) => api.postPackagesByFullPackageNameRoleAssignments({
            path: { fullPackageName },
            body: {
                user_id: addState.user_id,
                role: addState.role,
            }
        }));

        if (res.success) {
            toast.add({
                title: 'Role assignment created',
                description: 'The role assignment has been created successfully.',
                icon: 'i-lucide-check',
                color: 'success',
            });
            resetAddForm();
            await roleAssignments.refresh();
        } else {
            throw new Error(res.message || 'Failed to create role assignment');
        }
    } catch (error: any) {
        toast.add({
            title: 'Error',
            description: error.message || 'An unexpected error occurred.',
            icon: 'i-lucide-x-circle',
            color: 'error',
        });
    } finally {
        addSubmitting.value = false;
    }
}

// --- Edit Role Assignment ---
const showEditModal = ref(false);
const editTarget = ref<{ userId: number; role: string } | null>(null);
const editRole = ref<'ADMIN' | 'MAINTAINER' | 'DEVELOPER' | 'VIEWER'>('MAINTAINER');
const editSubmitting = ref(false);

function openEditRole(assignment: PackageRoleAssignment) {
    editTarget.value = { userId: assignment.user_id, role: assignment.role };
    editRole.value = assignment.role as 'ADMIN' | 'MAINTAINER' | 'DEVELOPER' | 'VIEWER';
    showEditModal.value = true;
}

async function onEditRoleAssignment() {
    if (!editTarget.value) return;
    const target = editTarget.value;

    editSubmitting.value = true;
    try {
        const res = await useAPI((api) => api.putPackagesByFullPackageNameRoleAssignmentsByUserId({
            path: {
                fullPackageName: fullPackageName,
                userId: target.userId,
            },
            body: {
                role: editRole.value,
            }
        }));

        if (res.success) {
            toast.add({
                title: 'Role updated',
                description: `Role assignment has been updated to ${editRole.value}.`,
                icon: 'i-lucide-check',
                color: 'success',
            });
            showEditModal.value = false;
            editTarget.value = null;
            await roleAssignments.refresh();
        } else {
            throw new Error(res.message || 'Failed to update role assignment');
        }
    } catch (error: any) {
        toast.add({
            title: 'Error',
            description: error.message || 'An unexpected error occurred.',
            icon: 'i-lucide-x-circle',
            color: 'error',
        });
    } finally {
        editSubmitting.value = false;
    }
}

// --- Remove Role Assignment ---
const deleteConfirmOpen = ref(false);
const deleteTarget = ref<{ userId: number } | null>(null);

function openDeleteAssignment(assignment: PackageRoleAssignment) {
    deleteTarget.value = { userId: assignment.user_id };
    deleteConfirmOpen.value = true;
}

async function onRemoveAssignment() {
    if (!deleteTarget.value) return;
    const target = deleteTarget.value;

    try {
        const res = await useAPI((api) => api.deletePackagesByFullPackageNameRoleAssignmentsByUserId({
            path: {
                fullPackageName: fullPackageName,
                userId: target.userId,
            }
        }));

        if (res.success) {
            toast.add({
                title: 'Role assignment removed',
                description: 'The role assignment has been removed.',
                icon: 'i-lucide-check',
                color: 'success',
            });
            deleteConfirmOpen.value = false;
            deleteTarget.value = null;
            await roleAssignments.refresh();
        } else {
            throw new Error(res.message || 'Failed to remove role assignment');
        }
    } catch (error: any) {
        toast.add({
            title: 'Error',
            description: error.message || 'An unexpected error occurred.',
            icon: 'i-lucide-x-circle',
            color: 'error',
        });
    }
}
</script>

<template>
    <div class="space-y-6 w-full lg:w-3xl mx-auto">
        <DashboardDataTable
            :data="roleAssignments.data"
            :columns="roleAssignmentsTableColumns"
            :loading="roleAssignments.loading"
            empty-title="No role assignments"
            empty-description="Assign roles to users for this package."
            empty-icon="i-lucide-shield"
            @refresh="roleAssignments.refresh()"
        >
            <template #header-right>
                <UButton
                    label="Add Assignment"
                    icon="i-lucide-plus"
                    color="primary"
                    @click="showAddModal = true"
                />
            </template>

            <template #user_username-cell="{ row }">
                <span class="font-medium text-sky-400">
                    {{ row.original.user_username }}
                </span>
            </template>

            <template #user_display_name-cell="{ row }">
                <span class="text-slate-100">
                    {{ row.original.user_display_name || '—' }}
                </span>
            </template>

            <template #role-cell="{ row }">
                <UBadge
                    :color="roleBadgeColor[row.original.role] || 'neutral'"
                    variant="soft"
                    size="sm"
                >
                    {{ row.original.role }}
                </UBadge>
            </template>

            <template #created_at-cell="{ row }">
                <span class="text-sm text-slate-400">
                    {{ new Date(row.original.created_at).toLocaleDateString() }}
                </span>
            </template>

            <template #actions-cell="{ row }">
                <div class="flex gap-1">
                    <UButton
                        icon="i-lucide-pencil"
                        variant="ghost"
                        color="neutral"
                        size="xs"
                        @click="openEditRole(row.original)"
                    />
                    <UButton
                        icon="i-lucide-x"
                        variant="ghost"
                        color="error"
                        size="xs"
                        @click="openDeleteAssignment(row.original)"
                    />
                </div>
            </template>

            <template #empty-actions>
                <UButton
                    label="Add Assignment"
                    color="primary"
                    @click="showAddModal = true"
                />
            </template>
        </DashboardDataTable>
    </div>

    <!-- Add Role Assignment Modal -->
    <DashboardModal
        v-model:open="showAddModal"
        title="Add Role Assignment"
        icon="i-lucide-shield-plus"
    >
        <UForm :state="addState" @submit="onAddRoleAssignment" class="space-y-4">
            <UFormField label="User" name="user_search" required>
                <div class="relative w-full">
                    <UInput
                        v-model="userSearchQuery"
                        placeholder="Search by username or display name..."
                        class="w-full"
                        @input="onUserSearchInput(($event.target as HTMLInputElement).value)"
                    >
                        <template v-if="searchLoading" #trailing>
                            <UIcon name="i-lucide-loader-circle" class="animate-spin" />
                        </template>
                    </UInput>

                    <!-- Search results dropdown -->
                    <div
                        v-if="searchResults.length > 0"
                        class="absolute z-50 w-full mt-1 rounded-lg border border-slate-700 bg-slate-900 shadow-xl max-h-48 overflow-y-auto"
                    >
                        <button
                            v-for="user in searchResults"
                            :key="user.id"
                            type="button"
                            class="w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors"
                            @click="selectUser(user)"
                        >
                            <UIcon name="i-lucide-user" class="w-4 h-4 shrink-0 text-slate-500" />
                            <span class="font-medium">{{ user.username }}</span>
                            <span v-if="user.display_name" class="text-slate-500">({{ user.display_name }})</span>
                        </button>
                    </div>

                    <!-- Selected user indicator -->
                    <p v-if="selectedUser" class="text-xs text-emerald-400 mt-1.5 flex items-center gap-1">
                        <UIcon name="i-lucide-check-circle" class="w-3.5 h-3.5" />
                        Selected: <strong>{{ selectedUser.username }}</strong>
                        <span v-if="selectedUser.display_name" class="text-slate-500">— {{ selectedUser.display_name }}</span>
                    </p>
                </div>
            </UFormField>

            <UFormField label="Role" name="role" required>
                <USelect
                    v-model="addState.role"
                    :items="roleOptions"
                    class="w-full"
                />
            </UFormField>

            <div class="flex justify-end gap-2 pt-4">
                <UButton
                    label="Cancel"
                    color="neutral"
                    variant="ghost"
                    @click="resetAddForm()"
                />
                <UButton
                    type="submit"
                    label="Add"
                    color="primary"
                    :loading="addSubmitting"
                    icon="i-lucide-shield-plus"
                />
            </div>
        </UForm>
    </DashboardModal>

    <!-- Edit Role Modal -->
    <DashboardModal
        v-model:open="showEditModal"
        title="Edit Role Assignment"
        icon="i-lucide-pencil"
    >
        <div class="space-y-4">
            <p class="text-sm text-slate-400">
                Update role for <strong class="text-white">{{ roleAssignments.data?.find(a => a.user_id === editTarget?.userId)?.user_username || 'User #' + editTarget?.userId }}</strong>
            </p>

            <UFormField label="Role" name="role" required>
                <USelect
                    v-model="editRole"
                    :items="roleOptions"
                    class="w-full"
                />
            </UFormField>

            <div class="flex justify-end gap-2 pt-4">
                <UButton
                    label="Cancel"
                    color="neutral"
                    variant="ghost"
                    @click="showEditModal = false"
                />
                <UButton
                    label="Save"
                    color="primary"
                    :loading="editSubmitting"
                    icon="i-lucide-save"
                    @click="onEditRoleAssignment"
                />
            </div>
        </div>
    </DashboardModal>

    <!-- Remove Role Assignment Modal -->
    <DashboardDeleteModal
        title="Remove Role Assignment"
        :warning-text="`Are you sure you want to remove this role assignment?`"
        v-model:open="deleteConfirmOpen"
        :on-delete="onRemoveAssignment"
        :prevent-auto-close="true"
    />
</template>
