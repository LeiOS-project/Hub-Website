<script setup lang="ts">
import type { TableColumn } from '#ui/types'
import type { GetDevPackagesResponses } from '@/api-client/types.gen'
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useAPI } from '@/composables/useAPI'
import DashboardPageBody from '~/components/dashboard/DashboardPageBody.vue'

type DevPackage = GetDevPackagesResponses[200]['data'][number]

definePageMeta({
    layout: 'dashboard'
})

useSeoMeta({
    title: 'Packages | LeiOS Hub',
    description: 'Manage your packages'
})

const route = useRoute()
const toast = useToast()

const showCreateModal = ref(route.query.action === 'create')

const packageTableColumns: TableColumn<DevPackage>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'description', header: 'Description' },
    { accessorKey: 'homepage_url', header: 'Homepage' },
    { id: 'stable', header: 'Stable' },
    { id: 'testing', header: 'Testing' },
    { id: 'actions', header: '', enableSorting: false, enableHiding: false }
]

const packages = await useAPIAsyncData(
    "dev-packages", async () => {
        const res = await useAPI((api) => api.getDevPackages({}));
        if (!res.success) {
            toast.add({ title: 'Failed to load packages', description: res.message, color: 'error' })
            return [];
        }
        return res.data;
    }
)

const createSchema = z.object({
    name: z.string().min(1, 'Name is required').regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers and hyphens'),
    description: z.string().min(1, 'Description is required'),
    homepage_url: z.url('Must be a valid URL')
})

type CreateSchema = z.output<typeof createSchema>;
    
const createState = reactive<Partial<CreateSchema>>({
    name: undefined,
    description: undefined,
    homepage_url: undefined
});

async function handleCreate(event: FormSubmitEvent<CreateSchema>) {

    toast.add({ title: 'Creating package...', icon: 'i-lucide-loader-2', color: 'neutral' })

    const res = await useAPI((api) => api.postDevPackages({
        body: event.data
    }));
    
    if (res.success) {
        toast.add({ title: 'Package created', color: 'success' })
        showCreateModal.value = false
        await packages.refresh()
    } else {
        toast.add({ title: 'Create failed', description: res.message, color: 'error' })
    }
}
</script>

<template>
    <UDashboardPanel>
        <template #header>
            <!-- <UDashboardNavbar title="Packages" icon="i-lucide-package">
                <template #right>
                    <UButton
                        label="New Package"
                        icon="i-lucide-plus"
                        color="primary"
                        @click="showCreateModal = true"
                    />
                </template>
            </UDashboardNavbar> -->
            <DashboardPageHeader
                title="Packages"
                icon="i-lucide-package"
                description="Manage your packages"
            />
        </template>

        <template #body>
            <DashboardPageBody>
                <!-- <div v-if="packages.loading" class="flex items-center justify-center py-12">
                    <UIcon name="i-lucide-loader-2" class="animate-spin text-3xl text-slate-400" />
                </div>

                <UTable
                    :data="package_data || []"
                    :columns="packageTableColumns"
                >
                    <template #name-cell="{ row }">
                        <NuxtLink
                            :to="`/dashboard/packages/${row.original.name}`"
                            class="font-medium text-sky-400 hover:underline"
                        >
                            {{ row.original.name }}
                        </NuxtLink>
                    </template>
                    <template #description-cell="{ row }">
                        <span class="text-slate-400 line-clamp-1 max-w-xs">
                            {{ row.original.description || '—' }}
                        </span>
                    </template>
                    <template #homepage_url-cell="{ row }">
                        <UButton
                            v-if="row.original.homepage_url"
                            :to="row.original.homepage_url"
                            target="_blank"
                            icon="i-lucide-external-link"
                            variant="ghost"
                            color="neutral"
                            size="xs"
                        />
                        <span v-else class="text-slate-500">—</span>
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
                        <div class="flex gap-1">
                            <UButton
                                icon="i-lucide-upload"
                                variant="ghost"
                                color="neutral"
                                size="xs"
                                :to="`/dashboard/packages/${row.original.name}?action=upload`"
                            />
                            <UButton
                                icon="i-lucide-settings"
                                variant="ghost"
                                color="neutral"
                                size="xs"
                                :to="`/dashboard/packages/${row.original.name}`"
                            />
                        </div>
                    </template>
                </UTable>

                <UEmpty
                    v-else
                    icon="i-lucide-package-x"
                    title="No packages"
                    description="Create your first package to get started."
                >
                    <template #actions>
                        <UButton
                            label="Create Package"
                            color="primary"
                            @click="showCreateModal = true"
                        />
                    </template>
                </UEmpty> -->

                <DashboardDataTable
                    :data="packages.data"
                    :columns="packageTableColumns"
                    :loading="packages.loading"
                    :filters="[
                        { 
                            column: 'name', 
                            type: 'text',
                            placeholder: 'Search version...', 
                            icon: 'i-lucide-search' 
                        }
                    ]"
                    empty-title="No packages"
                    empty-description="Create the first package to get started."
                    empty-icon="i-lucide-package"
                    @refresh="packages.refresh()"
                >
                    <template #header-right>
                        <UButton
                            label="New Package"
                            icon="i-lucide-plus"
                            color="primary"
                            @click="showCreateModal = true"
                        />
                    </template>

                    <template #name-cell="{ row }">
                        <NuxtLink
                            :to="`/dashboard/packages/${row.original.name}`"
                            class="font-medium text-sky-400 hover:underline"
                        >
                            {{ row.original.name }}
                        </NuxtLink>
                    </template>

                    <template #description-cell="{ row }">
                        <span class="text-slate-400 line-clamp-1 max-w-xs">
                            {{ row.original.description || '—' }}
                        </span>
                    </template>

                    <template #homepage_url-cell="{ row }">
                        <UButton
                            v-if="row.original.homepage_url"
                            :to="row.original.homepage_url"
                            target="_blank"
                            icon="i-lucide-external-link"
                            variant="ghost"
                            color="neutral"
                            size="xs"
                        />
                        <span v-else class="text-slate-500">—</span>
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
                        <div class="flex gap-1">
                            <UButton
                                icon="i-lucide-upload"
                                variant="ghost"
                                color="neutral"
                                size="xs"
                                :to="`/dashboard/packages/${row.original.name}?action=upload`"
                            />
                            <UButton
                                icon="i-lucide-settings"
                                variant="ghost"
                                color="neutral"
                                size="xs"
                                :to="`/dashboard/packages/${row.original.name}`"
                            />
                        </div>
                    </template>
                </DashboardDataTable>

            </DashboardPageBody>
        </template>
    </UDashboardPanel>

    <!-- Create Package Modal -->
    <!-- <DashboardModal
        v-model:open="showCreateModal"
        title="Create Package"
        icon="i-lucide-package-plus"
    >
        <UForm :schema="createSchema" :state="createState" @submit="handleCreate" class="space-y-4" >
            <UFormField label="Name" name="name" required>
                <UInput v-model="createState.name" placeholder="my-package" />
            </UFormField>

            <UFormField label="Description" name="description" required>
                <UTextarea v-model="createState.description" placeholder="A brief description of your package" />
            </UFormField>

            <UFormField label="Homepage URL" name="homepage_url" required class="w-full">
                <UInput v-model="createState.homepage_url" placeholder="https://github.com/..." />
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
    </DashboardModal> -->
</template>
