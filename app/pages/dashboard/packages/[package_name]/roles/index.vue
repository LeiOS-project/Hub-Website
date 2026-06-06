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
    { accessorKey: 'user_id', header: 'User ID' },
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

// --- Add Role Assignment ---
const showAddModal = ref(false);
const addState = reactive({
    user_id: 0 as number,
    role: 'MAINTAINER' as 'ADMIN' | 'MAINTAINER' | 'DEVELOPER' | 'VIEWER',
});
const addSubmitting = ref(false);

async function onAddRoleAssignment() {
    if (!addState.user_id) {
        toast.add({ title: 'Error', description: 'User ID is required.', color: 'error' });
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
            showAddModal.value = false;
            addState.user_id = 0;
            addState.role = 'MAINTAINER';
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

            <template #user_id-cell="{ row }">
                <span class="font-medium text-sky-400">
                    User #{{ row.original.user_id }}
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
            <UFormField label="User ID" name="user_id" required>
                <UInput
                    v-model="addState.user_id"
                    type="number"
                    placeholder="Enter user ID"
                    class="w-full"
                />
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
                    @click="showAddModal = false"
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
                Update role for <strong class="text-white">User #{{ editTarget?.userId }}</strong>
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
