<script setup lang="ts">
import type { TableColumn } from '#ui/types'
import type { GetAdminPackagesResponses } from '@/api-client/types.gen'
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { UserStore } from '~/utils/stores/userStore'

type AdminPackage = GetAdminPackagesResponses[200]['data'][number]

definePageMeta({
    layout: 'dashboard'
})

useSeoMeta({
    title: 'All Packages | LeiOS Hub',
    description: 'Manage all packages'
})

const toast = useToast()

// Check admin access
const currentUser = await UserStore.use().catch(() => null)
if (!currentUser || currentUser.role !== 'admin') {
    navigateTo('/dashboard')
}

const packageColumns: TableColumn<AdminPackage>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'owner_user_id', header: 'Owner ID' },
    { accessorKey: 'description', header: 'Description' },
    { id: 'stable', header: 'Stable' },
    { id: 'testing', header: 'Testing' },
    { id: 'actions', header: '', enableSorting: false, enableHiding: false }
]

const { data: packages, pending: loading, refresh } = await useAsyncData<AdminPackage[]>(
    'admin-packages-list',
    async () => {
        const res = await useAPI((api) => api.getAdminPackages({}))
        if (!res.success) {
            toast.add({ title: 'Failed to load packages', description: res.message, color: 'error' })
            return []
        }
        return res.data
    }
)

const showCreateModal = ref(false)
const showEditModal = ref(false)
const selectedPackage = ref<AdminPackage | null>(null)

const createSchema = z.object({
    name: z.string().min(1, 'Name is required').regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers and hyphens'),
    owner_user_id: z.number().min(1, 'Owner ID is required'),
    description: z.string().min(1, 'Description is required'),
    homepage_url: z.string().url('Must be a valid URL').or(z.literal(''))
})

type CreateSchema = z.output<typeof createSchema>

const editForm = reactive({
    description: '',
    homepage_url: ''
})

async function handleCreate(event: FormSubmitEvent<CreateSchema>) {
    const res = await useAPI((api) => api.postAdminPackages({ body: event.data }))
    if (res.success) {
        toast.add({ title: 'Package created', color: 'success' })
        showCreateModal.value = false
        await refresh()
    } else {
        toast.add({ title: 'Create failed', description: res.message, color: 'error' })
    }
}

function openEdit(pkg: AdminPackage) {
    selectedPackage.value = pkg
    editForm.description = pkg.description
    editForm.homepage_url = pkg.homepage_url
    showEditModal.value = true
}

async function submitEdit() {
    if (!selectedPackage.value) return

    const res = await useAPI((api) => api.putAdminPackagesPackageName({
        path: { packageName: selectedPackage.value!.name },
        body: {
            description: editForm.description,
            homepage_url: editForm.homepage_url
        }
    }))

    if (res.success) {
        toast.add({ title: 'Package updated', color: 'success' })
        showEditModal.value = false
        await refresh()
    } else {
        toast.add({ title: 'Update failed', description: res.message, color: 'error' })
    }
}

async function deletePackage(pkg: AdminPackage) {
    if (!confirm(`Are you sure you want to delete package "${pkg.name}"? This will delete all releases as well.`)) return

    const res = await useAPI((api) => api.deleteAdminPackagesPackageName({
        path: { packageName: pkg.name }
    }))

    if (res.success) {
        toast.add({ title: 'Package deleted', color: 'success' })
        await refresh()
    } else {
        toast.add({ title: 'Delete failed', description: res.message, color: 'error' })
    }
}
</script>

<template>
    <UDashboardPanel>
        <template #header>
            <UDashboardNavbar title="All Packages" icon="i-lucide-packages">
                <template #right>
                    <UButton
                        label="New Package"
                        icon="i-lucide-plus"
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
                    v-else-if="packages?.length"
                    :data="packages"
                    :columns="packageColumns"
                >
                    <template #id-cell="{ row }">
                        <span class="font-mono text-sm">#{{ row.original.id }}</span>
                    </template>
                    <template #name-cell="{ row }">
                        <span class="font-medium text-sky-400">{{ row.original.name }}</span>
                    </template>
                    <template #owner_user_id-cell="{ row }">
                        <span class="font-mono text-sm text-slate-400">#{{ row.original.owner_user_id }}</span>
                    </template>
                    <template #description-cell="{ row }">
                        <span class="text-slate-400 line-clamp-1 max-w-xs">
                            {{ row.original.description || '—' }}
                        </span>
                    </template>
                    <template #stable-cell="{ row }">
                        <div class="flex gap-1">
                            <UBadge v-if="row.original.latest_stable_release_amd64" color="success" variant="soft" size="sm">
                                amd64
                            </UBadge>
                            <UBadge v-if="row.original.latest_stable_release_arm64" color="success" variant="soft" size="sm">
                                arm64
                            </UBadge>
                            <span v-if="!row.original.latest_stable_release_amd64 && !row.original.latest_stable_release_arm64" class="text-slate-500">—</span>
                        </div>
                    </template>
                    <template #testing-cell="{ row }">
                        <div class="flex gap-1">
                            <UBadge v-if="row.original.latest_testing_release_amd64" color="warning" variant="soft" size="sm">
                                amd64
                            </UBadge>
                            <UBadge v-if="row.original.latest_testing_release_arm64" color="warning" variant="soft" size="sm">
                                arm64
                            </UBadge>
                            <span v-if="!row.original.latest_testing_release_amd64 && !row.original.latest_testing_release_arm64" class="text-slate-500">—</span>
                        </div>
                    </template>
                    <template #actions-cell="{ row }">
                        <UDropdownMenu
                            :items="[
                                [
                                    { label: 'Edit', icon: 'i-lucide-pencil', click: () => openEdit(row.original) },
                                    { label: 'View Releases', icon: 'i-lucide-list', to: `/dashboard/admin/packages/${row.original.name}` }
                                ],
                                [
                                    { label: 'Delete', icon: 'i-lucide-trash-2', color: 'error', click: () => deletePackage(row.original) }
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
                    icon="i-lucide-package-x"
                    title="No packages"
                    description="Create the first package to get started."
                >
                    <template #actions>
                        <UButton
                            label="Create Package"
                            color="primary"
                            @click="showCreateModal = true"
                        />
                    </template>
                </UEmpty>
            </div>
        </template>
    </UDashboardPanel>

    <!-- Create Package Modal -->
    <DashboardModal
        v-model:open="showCreateModal"
        title="Create Package"
        icon="i-lucide-package-plus"
    >
        <UForm :schema="createSchema" class="space-y-4" @submit="handleCreate">
            <UFormField label="Name" name="name" required>
                <UInput placeholder="my-package" />
            </UFormField>

            <UFormField label="Owner User ID" name="owner_user_id" required>
                <UInput type="number" placeholder="1" />
            </UFormField>

            <UFormField label="Description" name="description" required>
                <UTextarea placeholder="A brief description of the package" />
            </UFormField>

            <UFormField label="Homepage URL" name="homepage_url">
                <UInput placeholder="https://github.com/..." />
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
    </DashboardModal>

    <!-- Edit Package Modal -->
    <DashboardModal
        v-model:open="showEditModal"
        :title="`Edit Package: ${selectedPackage?.name}`"
        icon="i-lucide-pencil"
    >
        <div class="space-y-4">
            <UFormField label="Description">
                <UTextarea v-model="editForm.description" />
            </UFormField>

            <UFormField label="Homepage URL">
                <UInput v-model="editForm.homepage_url" />
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
    </DashboardModal>
</template>
