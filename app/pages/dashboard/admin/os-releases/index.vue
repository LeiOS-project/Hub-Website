<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import type { GetAdminOsReleasesResponses } from '~/api-client'
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import { getPaginationRowModel } from '@tanstack/table-core'

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

// for (let i = 0; i < 20; i++) {
//     osReleases.value?.push({
//         id: i + 1,
//         version: `2025.12.${String(i).padStart(2, '0')}`,
//         published_at: Date.now() - i * 1000 * 60 * 60 * 24
//     })
// }

const columnFilters = ref([{
    id: 'version',
    value: ''
}])

const table = useTemplateRef('table')

const versionSearch = computed({
  get: (): string => {
    return (table.value?.tableApi?.getColumn('version')?.getFilterValue() as string) || ''
  },
  set: (value: string) => {
    table.value?.tableApi?.getColumn('version')?.setFilterValue(value || undefined)
  }
})

const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})

const osReleasesTableColumns: TableColumn<OSRelease>[] = [
    { accessorKey: 'version' , header: 'Version' },
    { accessorKey: 'published_at', header: 'Published At' },
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

                <UCard class="border-slate-800 bg-slate-900/60">
                    <template #header>
                        <div class="flex flex-wrap items-center justify-between gap-1.5">
                        <!-- <div class="flex items-center gap-2">
                            <UIcon name="i-lucide-history" class="text-slate-400" />
                            <h2 class="text-lg font-semibold">OS Releases</h2>
                        </div> -->
                            <UInput
                                v-model="versionSearch"
                                class="max-w-sm"
                                icon="i-lucide-search"
                                placeholder="Filter by version..."
                            />
                            <div class="flex flex-wrap items-center gap-3">
                                <UButton
                                    label="Refresh"
                                    icon="i-lucide-refresh-cw"
                                    color="neutral"
                                    variant="subtle"
                                    @click="refresh()"
                                />
                                <UButton
                                    label="New Release"
                                    icon="i-lucide-plus"
                                    color="primary"
                                />
                            </div>
                        </div>
                    </template>

                    <div v-if="loading" class="flex items-center justify-center py-12">
                        <UIcon name="i-lucide-loader-2" class="animate-spin text-3xl text-slate-400" />
                    </div>

                    <UTable
                        v-else-if="osReleases?.length"
                        ref="table"
                        :data="osReleases"
                        :columns="osReleasesTableColumns"
                        v-model:column-filters="columnFilters"
                        v-model:pagination="pagination"
                        :pagination-options="{
                            getPaginationRowModel: getPaginationRowModel()
                        }"
                    >
                        <template #id-cell="{ row }">
                            <span class="font-mono text-sm"
                                >#{{ row.original.id }}</span
                            >
                        </template>
                        <template #name-cell="{ row }">
                            <span class="font-medium text-sky-400">
                                {{ row.original.version }}
                            </span>
                        </template>
                        <template #published_at-cell="{ row }">
                            <span class="font-mono text-sm">
                                {{ new Date(row.original.published_at).toLocaleString() }}
                            </span>
                        </template>
                    </UTable>

                    <UEmpty
                        v-else
                        icon="i-lucide-package-x"
                        title="No packages"
                        description="Create the first package to get started."
                        variant="naked"
                    >
                        <template #actions>
                            <UButton label="Create Package" color="primary" />
                        </template>
                    </UEmpty>

                    <template #footer>
                        <div class="flex items-center justify-between gap-3">
                            <div class="text-sm text-muted">
                                <!-- {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} of
                                {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} row(s) selected. -->
                                <USelect
                                    :items="[
                                        { label: '10', value: 10 },
                                        { label: '25', value: 25 },
                                        { label: '50', value: 50 },
                                        { label: '100', value: 100 },
                                    ]"
                                    size="md"
                                    class="min-w-18"
                                    :default-value="10"
                                    @update:model-value="(val: number) => {
                                        if (table) {
                                            table.tableApi.setPageSize(val)
                                        }
                                    }"
                                />
                            </div>

                            <div class="flex items-center gap-1.5">
                                <UPagination
                                    :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
                                    :items-per-page="table?.tableApi?.getState().pagination.pageSize"
                                    :total="table?.tableApi?.getFilteredRowModel().rows.length"
                                    @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)"
                                />
                            </div>
                        </div>
                    </template>
                </UCard>
            </div>
            
        </template>
    </UDashboardPanel>

</template>
