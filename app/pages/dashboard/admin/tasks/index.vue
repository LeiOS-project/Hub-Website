<script setup lang="ts">
import type { TableColumn } from '#ui/types'
import type { GetDevTasksResponses } from '@/api-client/types.gen'

type DevTask = GetDevTasksResponses[200]['data'][number]

definePageMeta({
    layout: 'dashboard'
})

useSeoMeta({
    title: 'Tasks | LeiOS Hub',
    description: 'View your scheduled tasks'
})

const toast = useToast()

const taskColumns: TableColumn<DevTask>[] = [
    { accessorKey: 'id', header: 'ID' },
    { id: 'status', header: 'Status' },
    { id: 'created', header: 'Created' },
    { id: 'finished', header: 'Finished' },
    { accessorKey: 'message', header: 'Message' },
    { id: 'actions', header: '', enableSorting: false, enableHiding: false }
]

const { data: tasks, pending: loading, refresh } = await useAsyncData<DevTask[]>(
    'dev-tasks-list',
    async () => {
        const res = await useAPI((api) => api.getDevTasks({}))
        if (!res.success) {
            toast.add({ title: 'Failed to load tasks', description: res.message, color: 'error' })
            return []
        }
        return res.data
    }
)

function formatDate(timestamp: number | null) {
    if (!timestamp) return '—'
    return new Date(timestamp * 1000).toLocaleString()
}

function getStatusColor(status: DevTask['status']) {
    switch (status) {
        case 'completed': return 'success'
        case 'running': return 'info'
        case 'failed': return 'error'
        case 'paused': return 'warning'
        default: return 'neutral'
    }
}

function getStatusIcon(status: DevTask['status']) {
    switch (status) {
        case 'completed': return 'i-lucide-check-circle'
        case 'running': return 'i-lucide-loader'
        case 'failed': return 'i-lucide-x-circle'
        case 'paused': return 'i-lucide-pause-circle'
        default: return 'i-lucide-clock'
    }
}
</script>

<template>
    <UDashboardPanel>
        <template #header>
            <UDashboardNavbar title="Tasks" icon="i-lucide-list-checks">
                <template #right>
                    <UButton
                        label="Refresh"
                        icon="i-lucide-refresh-cw"
                        color="neutral"
                        variant="ghost"
                        @click="refresh()"
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
                    v-else-if="tasks?.length"
                    :data="tasks"
                    :columns="taskColumns"
                >
                    <template #id-cell="{ row }">
                        <span class="font-mono text-sm">#{{ row.original.id }}</span>
                    </template>
                    <template #status-cell="{ row }">
                        <UBadge :color="getStatusColor(row.original.status)" variant="soft">
                            <UIcon
                                :name="getStatusIcon(row.original.status)"
                                :class="{ 'animate-spin': row.original.status === 'running' }"
                                class="mr-1"
                            />
                            {{ row.original.status }}
                        </UBadge>
                    </template>
                    <template #created-cell="{ row }">
                        <span class="text-sm text-slate-400">
                            {{ formatDate(row.original.created_at) }}
                        </span>
                    </template>
                    <template #finished-cell="{ row }">
                        <span class="text-sm text-slate-400">
                            {{ formatDate(row.original.finished_at) }}
                        </span>
                    </template>
                    <template #message-cell="{ row }">
                        <span class="text-slate-400 line-clamp-1 max-w-xs">
                            {{ row.original.message || '—' }}
                        </span>
                    </template>
                    <template #actions-cell="{ row }">
                        <UButton
                            v-if="row.original.storeLogs"
                            icon="i-lucide-file-text"
                            variant="ghost"
                            color="neutral"
                            size="xs"
                            :to="`/dashboard/tasks/${row.original.id}`"
                        />
                    </template>
                </UTable>

                <UEmpty
                    v-else
                    icon="i-lucide-clipboard-list"
                    title="No tasks"
                    description="Tasks will appear here when you upload releases or perform other operations."
                />
            </div>
        </template>
    </UDashboardPanel>
</template>
