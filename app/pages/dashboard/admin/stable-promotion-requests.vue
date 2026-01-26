<script setup lang="ts">
import type { TableColumn } from '#ui/types'
import type { GetAdminStablePromotionRequestsResponses } from '@/api-client/types.gen'
import { UserStore } from '~/utils/stores/userStore'

type StableRequest = GetAdminStablePromotionRequestsResponses[200]['data'][number]

definePageMeta({
    layout: 'dashboard'
})

useSeoMeta({
    title: 'Stable Promotion Requests | LeiOS Hub',
    description: 'Review stable promotion requests'
})

const toast = useToast()

const requestColumns: TableColumn<StableRequest>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'package_id', header: 'Package ID' },
    { accessorKey: 'package_release_id', header: 'Release ID' },
    { id: 'status', header: 'Status' },
    { accessorKey: 'admin_note', header: 'Note' },
    { id: 'actions', header: '', enableSorting: false, enableHiding: false }
]

const { data: requests, pending: loading, refresh } = await useAsyncData<StableRequest[]>(
    'admin-stable-requests',
    async () => {
        const res = await useAPI((api) => api.getAdminStablePromotionRequests({}))
        if (!res.success) {
            toast.add({ title: 'Failed to load requests', description: res.message, color: 'error' })
            return []
        }
        return res.data
    }
)

const pendingRequests = computed(() => requests.value?.filter(r => r.status === 'pending') || [])
const processedRequests = computed(() => requests.value?.filter(r => r.status !== 'pending') || [])

const decisionModal = ref(false)
const selectedRequest = ref<StableRequest | null>(null)
const decisionForm = reactive({
    status: 'approved' as 'approved' | 'denied',
    admin_note: ''
})

function openDecision(request: StableRequest) {
    selectedRequest.value = request
    decisionForm.status = 'approved'
    decisionForm.admin_note = ''
    decisionModal.value = true
}

async function submitDecision() {
    if (!selectedRequest.value) return

    const res = await useAPI((api) => api.postAdminStablePromotionRequestsStablePromotionRequestIdDecide({
        path: { stablePromotionRequestID: selectedRequest.value!.id },
        body: {
            status: decisionForm.status,
            admin_note: decisionForm.admin_note
        }
    }))

    if (res.success) {
        toast.add({
            title: decisionForm.status === 'approved' ? 'Request approved' : 'Request denied',
            color: 'success'
        })
        decisionModal.value = false
        await refresh()
    } else {
        toast.add({ title: 'Action failed', description: res.message, color: 'error' })
    }
}

function getStatusColor(status: StableRequest['status']) {
    switch (status) {
        case 'approved': return 'success'
        case 'denied': return 'error'
        default: return 'warning'
    }
}
</script>

<template>
    <UDashboardPanel>
        <template #header>
            <UDashboardNavbar title="Stable Promotion Requests" icon="i-lucide-git-pull-request">
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

                <template v-else>
                    <!-- Pending Requests -->
                    <UCard class="border-slate-800 bg-slate-900/60">
                        <template #header>
                            <div class="flex items-center gap-2">
                                <UIcon name="i-lucide-clock" class="text-amber-400" />
                                <h2 class="text-lg font-semibold">Pending Requests</h2>
                                <UBadge v-if="pendingRequests.length" color="warning" variant="soft">
                                    {{ pendingRequests.length }}
                                </UBadge>
                            </div>
                        </template>

                        <UTable
                            v-if="pendingRequests.length"
                            :data="pendingRequests"
                            :columns="requestColumns"
                        >
                            <template #id-cell="{ row }">
                                <span class="font-mono text-sm">#{{ row.original.id }}</span>
                            </template>
                            <template #status-cell="{ row }">
                                <UBadge :color="getStatusColor(row.original.status)" variant="soft">
                                    {{ row.original.status }}
                                </UBadge>
                            </template>
                            <template #admin_note-cell="{ row }">
                                <span class="text-slate-400 line-clamp-1 max-w-xs">
                                    {{ row.original.admin_note || '—' }}
                                </span>
                            </template>
                            <template #actions-cell="{ row }">
                                <div class="flex gap-1">
                                    <UButton
                                        icon="i-lucide-check"
                                        color="success"
                                        variant="soft"
                                        size="xs"
                                        @click="openDecision(row.original)"
                                    />
                                    <UButton
                                        icon="i-lucide-x"
                                        color="error"
                                        variant="soft"
                                        size="xs"
                                        @click="() => { selectedRequest = row.original; decisionForm.status = 'denied'; openDecision(row.original) }"
                                    />
                                </div>
                            </template>
                        </UTable>

                        <UEmpty
                            v-else
                            icon="i-lucide-inbox"
                            title="No pending requests"
                            description="All stable promotion requests have been processed."
                        />
                    </UCard>

                    <!-- Processed Requests -->
                    <UCard class="border-slate-800 bg-slate-900/60">
                        <template #header>
                            <div class="flex items-center gap-2">
                                <UIcon name="i-lucide-history" class="text-slate-400" />
                                <h2 class="text-lg font-semibold">History</h2>
                            </div>
                        </template>

                        <UTable
                            v-if="processedRequests.length"
                            :data="processedRequests"
                            :columns="requestColumns"
                        >
                            <template #id-cell="{ row }">
                                <span class="font-mono text-sm">#{{ row.original.id }}</span>
                            </template>
                            <template #status-cell="{ row }">
                                <UBadge :color="getStatusColor(row.original.status)" variant="soft">
                                    {{ row.original.status }}
                                </UBadge>
                            </template>
                            <template #admin_note-cell="{ row }">
                                <span class="text-slate-400 line-clamp-1 max-w-xs">
                                    {{ row.original.admin_note || '—' }}
                                </span>
                            </template>
                            <template #actions-cell />
                        </UTable>

                        <UEmpty
                            v-else
                            icon="i-lucide-archive"
                            title="No history"
                            description="Processed requests will appear here."
                        />
                    </UCard>
                </template>
            </div>
        </template>
    </UDashboardPanel>

    <!-- Decision Modal -->
    <DashboardModal
        v-model:open="decisionModal"
        :title="`Review Request #${selectedRequest?.id}`"
        icon="i-lucide-git-pull-request"
    >
        <div class="space-y-4">
            <div class="flex gap-2">
                <UButton
                    label="Approve"
                    icon="i-lucide-check"
                    :color="decisionForm.status === 'approved' ? 'success' : 'neutral'"
                    :variant="decisionForm.status === 'approved' ? 'solid' : 'outline'"
                    @click="decisionForm.status = 'approved'"
                />
                <UButton
                    label="Deny"
                    icon="i-lucide-x"
                    :color="decisionForm.status === 'denied' ? 'error' : 'neutral'"
                    :variant="decisionForm.status === 'denied' ? 'solid' : 'outline'"
                    @click="decisionForm.status = 'denied'"
                />
            </div>

            <UFormField label="Admin Note" :required="decisionForm.status === 'denied'">
                <UTextarea
                    v-model="decisionForm.admin_note"
                    placeholder="Add a note for this decision..."
                />
            </UFormField>

            <div class="flex justify-end gap-2 pt-4">
                <UButton
                    label="Cancel"
                    color="neutral"
                    variant="ghost"
                    @click="decisionModal = false"
                />
                <UButton
                    :label="decisionForm.status === 'approved' ? 'Approve' : 'Deny'"
                    :color="decisionForm.status === 'approved' ? 'success' : 'error'"
                    @click="submitDecision"
                />
            </div>
        </div>
    </DashboardModal>
</template>
