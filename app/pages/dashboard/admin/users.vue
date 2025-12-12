<script setup lang="ts">
import type { TableColumn } from '#ui/types'
import type { GetAdminUsersResponses } from '@/api-client/types.gen'
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { UserStore } from '~/utils/stores/userStore'

type AdminUser = GetAdminUsersResponses[200]['data'][number]

definePageMeta({
    layout: 'dashboard'
})

useSeoMeta({
    title: 'Users | LeiOS Hub',
    description: 'Manage users'
})

const toast = useToast()

// Check admin access
const currentUser = await UserStore.use().catch(() => null)
if (!currentUser || currentUser.role !== 'admin') {
    navigateTo('/dashboard')
}

const userColumns: TableColumn<AdminUser>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'username', header: 'Username' },
    { accessorKey: 'display_name', header: 'Display Name' },
    { accessorKey: 'email', header: 'Email' },
    { id: 'role', header: 'Role' },
    { id: 'actions', header: '', enableSorting: false, enableHiding: false }
]

const roleOptions = [
    { label: 'Admin', value: 'admin' },
    { label: 'Developer', value: 'developer' },
    { label: 'User', value: 'user' }
]

const { data: users, pending: loading, refresh } = await useAsyncData<AdminUser[]>(
    'admin-users-list',
    async () => {
        const res = await useAPI((api) => api.getAdminUsers({}))
        if (!res.success) {
            toast.add({ title: 'Failed to load users', description: res.message, color: 'error' })
            return []
        }
        return res.data
    }
)

const showCreateModal = ref(false)
const showEditModal = ref(false)
const showPasswordModal = ref(false)
const selectedUser = ref<AdminUser | null>(null)

const createSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    display_name: z.string().min(1, 'Display name is required'),
    email: z.string().email('Must be a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['admin', 'developer', 'user'])
})

type CreateSchema = z.output<typeof createSchema>

const editForm = reactive({
    display_name: '',
    email: '',
    role: 'developer' as 'admin' | 'developer' | 'user'
})

const passwordForm = reactive({
    password: ''
})

async function handleCreate(event: FormSubmitEvent<CreateSchema>) {
    const res = await useAPI((api) => api.postAdminUsers({ body: event.data }))
    if (res.success) {
        toast.add({ title: 'User created', color: 'success' })
        showCreateModal.value = false
        await refresh()
    } else {
        toast.add({ title: 'Create failed', description: res.message, color: 'error' })
    }
}

function openEdit(user: AdminUser) {
    selectedUser.value = user
    editForm.display_name = user.display_name
    editForm.email = user.email
    editForm.role = user.role
    showEditModal.value = true
}

async function submitEdit() {
    if (!selectedUser.value) return

    const res = await useAPI((api) => api.putAdminUsersUserId({
        path: { userId: selectedUser.value!.id },
        body: {
            display_name: editForm.display_name,
            email: editForm.email,
            role: editForm.role
        }
    }))

    if (res.success) {
        toast.add({ title: 'User updated', color: 'success' })
        showEditModal.value = false
        await refresh()
    } else {
        toast.add({ title: 'Update failed', description: res.message, color: 'error' })
    }
}

function openPassword(user: AdminUser) {
    selectedUser.value = user
    passwordForm.password = ''
    showPasswordModal.value = true
}

async function submitPassword() {
    if (!selectedUser.value) return

    const res = await useAPI((api) => api.putAdminUsersUserIdPassword({
        path: { userId: selectedUser.value!.id },
        body: { password: passwordForm.password }
    }))

    if (res.success) {
        toast.add({ title: 'Password updated', color: 'success' })
        showPasswordModal.value = false
    } else {
        toast.add({ title: 'Update failed', description: res.message, color: 'error' })
    }
}

async function deleteUser(user: AdminUser) {
    if (!confirm(`Are you sure you want to delete user "${user.username}"?`)) return

    const res = await useAPI((api) => api.deleteAdminUsersUserId({
        path: { userId: user.id }
    }))

    if (res.success) {
        toast.add({ title: 'User deleted', color: 'success' })
        await refresh()
    } else {
        toast.add({ title: 'Delete failed', description: res.message, color: 'error' })
    }
}

function getRoleColor(role: AdminUser['role']) {
    switch (role) {
        case 'admin': return 'error'
        case 'developer': return 'info'
        default: return 'neutral'
    }
}
</script>

<template>
    <UDashboardPanel>
        <template #header>
            <UDashboardNavbar title="Users" icon="i-lucide-users">
                <template #right>
                    <UButton
                        label="New User"
                        icon="i-lucide-user-plus"
                        color="primary"
                        @click="showCreateModal = true"
                    />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="space-y-6">
                <div v-if="loading" class="flex items-center justify-center py-12">
                    <UIcon name="i-lucide-loader-2" class="animate-spin text-3xl text-slate-400" />
                </div>

                <UTable
                    v-else-if="users?.length"
                    :data="users"
                    :columns="userColumns"
                >
                    <template #id-cell="{ row }">
                        <span class="font-mono text-sm">#{{ row.original.id }}</span>
                    </template>
                    <template #username-cell="{ row }">
                        <span class="font-medium">{{ row.original.username }}</span>
                    </template>
                    <template #email-cell="{ row }">
                        <span class="text-slate-400">{{ row.original.email }}</span>
                    </template>
                    <template #role-cell="{ row }">
                        <UBadge :color="getRoleColor(row.original.role)" variant="soft">
                            {{ row.original.role }}
                        </UBadge>
                    </template>
                    <template #actions-cell="{ row }">
                        <UDropdownMenu
                            :items="[
                                [
                                    { label: 'Edit', icon: 'i-lucide-pencil', click: () => openEdit(row.original) },
                                    { label: 'Reset Password', icon: 'i-lucide-key', click: () => openPassword(row.original) }
                                ],
                                [
                                    { label: 'Delete', icon: 'i-lucide-trash-2', color: 'error', click: () => deleteUser(row.original) }
                                ]
                            ]"
                        >
                            <UButton
                                icon="i-lucide-more-horizontal"
                                variant="ghost"
                                color="neutral"
                                size="xs"
                            />
                        </UDropdownMenu>
                    </template>
                </UTable>

                <UEmpty
                    v-else
                    icon="i-lucide-users"
                    title="No users"
                    description="Create your first user to get started."
                >
                    <template #actions>
                        <UButton
                            label="Create User"
                            color="primary"
                            @click="showCreateModal = true"
                        />
                    </template>
                </UEmpty>
            </div>
        </template>
    </UDashboardPanel>

    <!-- Create User Modal -->
    <UModal v-model:open="showCreateModal">
        <template #content>
            <UCard class="border-slate-800">
                <template #header>
                    <div class="flex items-center gap-2">
                        <UIcon name="i-lucide-user-plus" class="text-sky-400" />
                        <h3 class="text-lg font-semibold">Create User</h3>
                    </div>
                </template>

                <UForm :schema="createSchema" class="space-y-4" @submit="handleCreate">
                    <UFormField label="Username" name="username" required>
                        <UInput placeholder="johndoe" />
                    </UFormField>

                    <UFormField label="Display Name" name="display_name" required>
                        <UInput placeholder="John Doe" />
                    </UFormField>

                    <UFormField label="Email" name="email" required>
                        <UInput type="email" placeholder="john@example.com" />
                    </UFormField>

                    <UFormField label="Password" name="password" required>
                        <UInput type="password" placeholder="••••••••" />
                    </UFormField>

                    <UFormField label="Role" name="role" required>
                        <USelect :options="roleOptions" placeholder="Select role" />
                    </UFormField>

                    <div class="flex justify-end gap-2 pt-4">
                        <UButton
                            label="Cancel"
                            color="neutral"
                            variant="ghost"
                            @click="showCreateModal = false"
                        />
                        <UButton
                            type="submit"
                            label="Create"
                            color="primary"
                        />
                    </div>
                </UForm>
            </UCard>
        </template>
    </UModal>

    <!-- Edit User Modal -->
    <UModal v-model:open="showEditModal">
        <template #content>
            <UCard class="border-slate-800">
                <template #header>
                    <div class="flex items-center gap-2">
                        <UIcon name="i-lucide-pencil" class="text-sky-400" />
                        <h3 class="text-lg font-semibold">Edit User: {{ selectedUser?.username }}</h3>
                    </div>
                </template>

                <div class="space-y-4">
                    <UFormField label="Display Name">
                        <UInput v-model="editForm.display_name" />
                    </UFormField>

                    <UFormField label="Email">
                        <UInput v-model="editForm.email" type="email" />
                    </UFormField>

                    <UFormField label="Role">
                        <USelect v-model="editForm.role" :options="roleOptions" />
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
                            @click="submitEdit"
                        />
                    </div>
                </div>
            </UCard>
        </template>
    </UModal>

    <!-- Password Modal -->
    <UModal v-model:open="showPasswordModal">
        <template #content>
            <UCard class="border-slate-800">
                <template #header>
                    <div class="flex items-center gap-2">
                        <UIcon name="i-lucide-key" class="text-amber-400" />
                        <h3 class="text-lg font-semibold">Reset Password: {{ selectedUser?.username }}</h3>
                    </div>
                </template>

                <div class="space-y-4">
                    <UFormField label="New Password">
                        <UInput v-model="passwordForm.password" type="password" placeholder="••••••••" />
                    </UFormField>

                    <div class="flex justify-end gap-2 pt-4">
                        <UButton
                            label="Cancel"
                            color="neutral"
                            variant="ghost"
                            @click="showPasswordModal = false"
                        />
                        <UButton
                            label="Update Password"
                            color="primary"
                            @click="submitPassword"
                        />
                    </div>
                </div>
            </UCard>
        </template>
    </UModal>
</template>
