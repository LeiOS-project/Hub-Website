<script setup lang="ts">
import type { GetAdminOsReleasesResponses } from '~/api-client'
import type { TableColumn } from '@nuxt/ui'

const toast = useToast()

type OSRelease = GetAdminOsReleasesResponses["200"]["data"][number];

definePageMeta({
    layout: 'dashboard'
});

useSeoMeta({
    title: 'OS Releases | LeiOS Hub',
    description: 'Manage OS Releases on LeiOS Hub'
});

const { data: osReleases, pending: loading, refresh } = await useAsyncData<OSRelease[]>(
    'admin-os-releases',
    async () => {
        const res = await useAPI((api) => api.getAdminOsReleases({}))
        if (!res.success) {
            toast.add({ title: 'Failed to load OS Releases', description: res.message, color: 'error' })
            return []
        }
        return res.data
    }
)

for (let i = 0; i < 50; i++) {
    osReleases.value?.push({
        id: i + 1,
        version: `2025.12.${String(i).padStart(2, '0')}`,
        created_at: Date.now() - i * 1000 * 60 * 60 * 24,
        published_at: Date.now() - i * 1000 * 60 * 60 * 24,
        publishing_status: (['pending', 'running', 'paused', 'completed', 'failed'] satisfies OSRelease['publishing_status'][])[Math.floor(Math.random() * 1000) % 5] as OSRelease['publishing_status'],
    })
}

const osReleasesTableColumns: TableColumn<OSRelease>[] = [
    { accessorKey: 'version' , header: 'Version' },
    { accessorKey: 'created_at', header: 'Created At' },
    { accessorKey: 'publishing_status', header: 'Publishing Status' },
    { accessorKey: 'published_at', header: 'Published At' },
]

function getPublishingStatusColor(status: OSRelease['publishing_status']) {
    switch (status) {
        case 'pending':
            return 'warning'
        case 'paused':
            return 'warning'
        case 'completed':
            return 'success'
        case 'failed':
            return 'error'
        case 'running':
            return 'info'
    }
}

// Filter options for publishing status
const publishingStatusOptions = [
    { label: 'Pending', value: 'pending' },
    { label: 'Running', value: 'running' },
    { label: 'Paused', value: 'paused' },
    { label: 'Completed', value: 'completed' },
    { label: 'Failed', value: 'failed' },
]

</script>

<template>
    <UDashboardPanel>
        <template #header>
            <UDashboardNavbar title="OS Releases" icon="i-lucide-rocket">
                <!-- <template #right>
                    <UButton
                        label="New Release"
                        icon="i-lucide-plus"
                        color="primary"
                    />
                </template> -->
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="space-y-6">

                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl font-bold">
                            LeiOS Releases
                        </h1>
                        <p class="text-slate-400 mt-1">
                            Here's an overview of your all OS Releases on LeiOS Hub.
                        </p>
                    </div>
                </div>
                
                <DashboardDataTable
                    :data="osReleases || []"
                    :columns="osReleasesTableColumns"
                    :loading="loading"
                    :filters="[
                        { 
                            column: 'version', 
                            type: 'text',
                            placeholder: 'Search version...', 
                            icon: 'i-lucide-search' 
                        },
                        { 
                            column: 'publishing_status', 
                            type: 'multi-select',
                            placeholder: 'All statuses',
                            icon: 'i-lucide-filter',
                            options: publishingStatusOptions
                        }
                    ]"
                    empty-title="No releases"
                    empty-description="Create the first release to get started."
                    empty-icon="i-lucide-rocket"
                    @refresh="refresh()"
                >
                    <template #header-right>
                        <UButton
                            label="New Release"
                            icon="i-lucide-plus"
                            color="primary"
                        />
                    </template>

                    <template #name-cell="{ row }">
                        <span class="font-medium text-sky-400">
                            {{ row.original.version }}
                        </span>
                    </template>
                    <template #created_at-cell="{ row }">
                        <span class="text-sm">
                            {{ new Date(row.original.created_at).toLocaleString() }}
                        </span>
                    </template>
                    <template #publishing_status-cell="{ row }">
                        <UBadge
                            :color="getPublishingStatusColor(row.original.publishing_status) || 'neutral'"
                            variant="subtle"
                            class="capitalize"
                        >
                            {{ row.original.publishing_status || "Unknown" }}
                        </UBadge>
                    </template>
                    <template #published_at-cell="{ row }">
                        <span class="text-sm">{{
                                (row.original.published_at && row.original.publishing_status === 'completed')
                                    ? new Date(row.original.published_at).toLocaleString()
                                    : "N / A"
                        }}</span>
                    </template>

                    <template #empty-actions>
                        <UButton label="Create Release" color="primary" />
                    </template>
                </DashboardDataTable>
            </div>
        </template>
    </UDashboardPanel>
</template>
