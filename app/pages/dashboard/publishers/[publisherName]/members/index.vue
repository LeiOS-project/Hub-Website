<script setup lang="ts">
import type { TableColumn } from '#ui/types'
import type { Publisher, PublisherMember } from '~/utils/types'

definePageMeta({
    layout: 'dashboard'
});

const route = useRoute();
const toast = useToast();

const publisherName = route.params.publisherName as string;

const roleBadgeColor: Record<string, 'info' | 'success' | 'warning' | 'neutral'> = {
    ADMIN: 'info',
    MAINTAINER: 'success',
    DEVELOPER: 'warning',
    VIEWER: 'neutral',
};

const roleOptions = [
    { label: 'ADMIN', value: 'ADMIN' },
    { label: 'MAINTAINER', value: 'MAINTAINER' },
    { label: 'DEVELOPER', value: 'DEVELOPER' },
    { label: 'VIEWER', value: 'VIEWER' },
];

const membersTableColumns: TableColumn<PublisherMember>[] = [
    { accessorKey: 'user_username', header: 'Username' },
    { accessorKey: 'user_display_name', header: 'Display Name' },
    { accessorKey: 'role', header: 'Role' },
    { accessorKey: 'added_at', header: 'Added At' },
    { accessorKey: 'actions', header: '', enableSorting: false, enableHiding: false }
];

const members = await useAPILazyAsyncData<PublisherMember[]>(
    `/publishers/${publisherName}/members`,
    async () => {
        const res = await useAPI((api) => api.getPublishersByPublisherNameMembers({
            path: { publisherName }
        }));
        if (!res.success) {
            toast.add({ title: 'Failed to load members', description: res.message, color: 'error' });
            return [];
        }
        return res.data;
    }
);

// --- Add Member ---
const showAddModal = ref(false);
const addMemberState = reactive({
    user_id: 0 as number,
    role: 'MAINTAINER' as 'ADMIN' | 'MAINTAINER' | 'DEVELOPER' | 'VIEWER',
});
const addSubmitting = ref(false);

async function onAddMember() {
    if (!addMemberState.user_id) {
        toast.add({ title: 'Error', description: 'User ID is required.', color: 'error' });
        return;
    }

    addSubmitting.value = true;
    try {
        const res = await useAPI((api) => api.postPublishersByPublisherNameMembers({
            path: { publisherName },
            body: {
                user_id: addMemberState.user_id,
                role: addMemberState.role,
            }
        }));

        if (res.success) {
            toast.add({
                title: 'Member added',
                description: 'The member has been added successfully.',
                icon: 'i-lucide-check',
                color: 'success',
            });
            showAddModal.value = false;
            addMemberState.user_id = 0;
            addMemberState.role = 'MAINTAINER';
            await members.refresh();
        } else {
            throw new Error(res.message || 'Failed to add member');
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

// --- Edit Member Role ---
const showEditModal = ref(false);
const editMember = ref<{ id: number; userId: number; role: string; username: string } | null>(null);
const editRole = ref<'ADMIN' | 'MAINTAINER' | 'DEVELOPER' | 'VIEWER'>('MAINTAINER');
const editSubmitting = ref(false);

function openEditRole(member: PublisherMember) {
    editMember.value = {
        id: member.id,
        userId: member.user_id,
        role: member.role,
        username: member.user_username,
    };
    editRole.value = member.role as 'ADMIN' | 'MAINTAINER' | 'DEVELOPER' | 'VIEWER';
    showEditModal.value = true;
}

async function onEditMemberRole() {
    if (!editMember.value) return;
    const target = editMember.value;

    editSubmitting.value = true;
    try {
        const res = await useAPI((api) => api.putPublishersByPublisherNameMembersByUserId({
            path: {
                publisherName,
                userId: target.userId,
            },
            body: {
                role: editRole.value,
            }
        }));

        if (res.success) {
            toast.add({
                title: 'Role updated',
                description: `Member's role has been updated to ${editRole.value}.`,
                icon: 'i-lucide-check',
                color: 'success',
            });
            showEditModal.value = false;
            editMember.value = null;
            await members.refresh();
        } else {
            throw new Error(res.message || 'Failed to update member role');
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

// --- Remove Member ---
const deleteConfirmOpen = ref(false);
const deleteTarget = ref<{ userId: number; username: string } | null>(null);

function openDeleteMember(member: PublisherMember) {
    deleteTarget.value = { userId: member.user_id, username: member.user_username };
    deleteConfirmOpen.value = true;
}

async function onRemoveMember() {
    if (!deleteTarget.value) return;
    const target = deleteTarget.value;

    try {
        const res = await useAPI((api) => api.deletePublishersByPublisherNameMembersByUserId({
            path: {
                publisherName,
                userId: target.userId,
            }
        }));

        if (res.success) {
            toast.add({
                title: 'Member removed',
                description: `"${target.username}" has been removed.`,
                icon: 'i-lucide-check',
                color: 'success',
            });
            deleteConfirmOpen.value = false;
            deleteTarget.value = null;
            await members.refresh();
        } else {
            throw new Error(res.message || 'Failed to remove member');
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
            :data="members.data"
            :columns="membersTableColumns"
            :loading="members.loading"
            empty-title="No members"
            empty-description="Add members to this publisher."
            empty-icon="i-lucide-users"
            @refresh="members.refresh()"
        >
            <template #header-right>
                <UButton
                    label="Add Member"
                    icon="i-lucide-user-plus"
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

            <template #added_at-cell="{ row }">
                <span class="text-sm text-slate-400">
                    {{ new Date(row.original.added_at).toLocaleDateString() }}
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
                        icon="i-lucide-user-x"
                        variant="ghost"
                        color="error"
                        size="xs"
                        @click="openDeleteMember(row.original)"
                    />
                </div>
            </template>

            <template #empty-actions>
                <UButton
                    label="Add Member"
                    color="primary"
                    @click="showAddModal = true"
                />
            </template>
        </DashboardDataTable>
    </div>

    <!-- Add Member Modal -->
    <DashboardModal
        v-model:open="showAddModal"
        title="Add Member"
        icon="i-lucide-user-plus"
    >
        <UForm :state="addMemberState" @submit="onAddMember" class="space-y-4">
            <UFormField label="User ID" name="user_id" required>
                <UInput
                    v-model="addMemberState.user_id"
                    type="number"
                    placeholder="Enter user ID"
                    class="w-full"
                />
            </UFormField>

            <UFormField label="Role" name="role" required>
                <USelect
                    v-model="addMemberState.role"
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
                    icon="i-lucide-user-plus"
                />
            </div>
        </UForm>
    </DashboardModal>

    <!-- Edit Role Modal -->
    <DashboardModal
        v-model:open="showEditModal"
        title="Edit Member Role"
        icon="i-lucide-pencil"
    >
        <div class="space-y-4">
            <p class="text-sm text-slate-400">
                Update role for <strong class="text-white">{{ editMember?.username }}</strong>
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
                    @click="onEditMemberRole"
                />
            </div>
        </div>
    </DashboardModal>

    <!-- Remove Member Modal -->
    <DashboardDeleteModal
        title="Remove Member"
        :warning-text="`Are you sure you want to remove &quot;${deleteTarget?.username || ''}&quot; from this publisher?`"
        v-model:open="deleteConfirmOpen"
        :on-delete="onRemoveMember"
        :prevent-auto-close="true"
    />
</template>
