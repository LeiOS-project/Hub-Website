<script setup lang="ts" generic="T">
import type { TableColumn, TableRow } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import { getPaginationRowModel } from '@tanstack/table-core'

// Cell slot props type (matches UTable's slot props)
type CellSlotProps = {
    row: Row<T>
}

// Props
interface Props {
    /** Table data */
    data: T[]
    /** Table columns configuration */
    columns: TableColumn<T>[]
    /** Loading state */
    loading?: boolean
    /** Filter column key for search input */
    filterColumn?: string
    /** Search input placeholder */
    filterPlaceholder?: string
    /** Default page size */
    defaultPageSize?: number
    /** Available page size options */
    pageSizeOptions?: number[]
    /** Show refresh button */
    showRefresh?: boolean
    /** Show pagination */
    showPagination?: boolean
    /** Show page size selector */
    showPageSizeSelector?: boolean
    /** Empty state title */
    emptyTitle?: string
    /** Empty state description */
    emptyDescription?: string
    /** Empty state icon */
    emptyIcon?: string
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
    filterColumn: undefined,
    filterPlaceholder: 'Search...',
    defaultPageSize: 10,
    pageSizeOptions: () => [10, 25, 50, 100],
    showRefresh: true,
    showPagination: true,
    showPageSizeSelector: true,
    emptyTitle: 'No data',
    emptyDescription: 'No items found.',
    emptyIcon: 'i-lucide-database'
})

// Emits
const emit = defineEmits<{
    /** Emitted when refresh button is clicked */
    refresh: []
    /** Emitted when a row is selected/clicked */
    'row-click': [row: T]
}>()

// Slots with proper typing for type checking
defineSlots<
    {
        /** Header left side content (before search) */
        'header-left'?: () => any
        /** Header right side content (after refresh button) */
        'header-right'?: () => any
        /** Custom empty state */
        'empty'?: () => any
        /** Actions in the empty state */
        'empty-actions'?: () => any
        /** Footer left side content */
        'footer-left'?: () => any
        /** Footer right side content (replaces pagination) */
        'footer-right'?: () => any
    } & {
        /** Dynamic cell slots - use #[columnKey]-cell="{ row }" */
        [K: `${string}-cell`]: (props: CellSlotProps) => any
    }
>()

// Use useSlots for dynamic slot access (avoids index signature issues)
const slots = useSlots()

// Table ref
const table = useTemplateRef('table')

// Column filters state
const columnFilters = ref<{ id: string; value: string }[]>([])

// Initialize filter for the specified column
watchEffect(() => {
    if (props.filterColumn) {
        const existingFilter = columnFilters.value.find(f => f.id === props.filterColumn)
        if (!existingFilter) {
            columnFilters.value = [{ id: props.filterColumn, value: '' }]
        }
    }
})

// Search computed property
const searchValue = computed({
    get: (): string => {
        if (!props.filterColumn) return ''
        return (table.value?.tableApi?.getColumn(props.filterColumn)?.getFilterValue() as string) || ''
    },
    set: (value: string) => {
        if (props.filterColumn) {
            table.value?.tableApi?.getColumn(props.filterColumn)?.setFilterValue(value || undefined)
        }
    }
})

// Pagination state
const pagination = ref({
    pageIndex: 0,
    pageSize: props.defaultPageSize
})

// Page size select items
const pageSizeItems = computed(() =>
    props.pageSizeOptions.map(size => ({
        label: String(size),
        value: size
    }))
)

// Handle page size change
function handlePageSizeChange(value: number) {
    table.value?.tableApi?.setPageSize(value)
}

// Handle refresh
function handleRefresh() {
    emit('refresh')
}

// Expose table ref and API for parent component access
defineExpose({
    table,
    tableApi: computed(() => table.value?.tableApi)
})
</script>

<template>
    <UCard class="border-slate-800 bg-slate-900/60">
        <template #header>
            <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="flex flex-wrap items-center gap-3">
                    <slot name="header-left" />
                    
                    <UInput
                        v-if="filterColumn"
                        v-model="searchValue"
                        class="max-w-sm min-w-48"
                        icon="i-lucide-search"
                        :placeholder="filterPlaceholder"
                    />
                </div>
                
                <div class="flex flex-wrap items-center gap-3">
                    <UButton
                        v-if="showRefresh"
                        label="Refresh"
                        icon="i-lucide-refresh-cw"
                        color="neutral"
                        variant="subtle"
                        @click="handleRefresh"
                    />
                    
                    <slot name="header-right" />
                </div>
            </div>
        </template>

        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-12">
            <UIcon name="i-lucide-loader-2" class="animate-spin text-3xl text-slate-400" />
        </div>

        <!-- Table -->
        <UTable
            v-else-if="data?.length"
            ref="table"
            :data="data"
            :columns="columns"
            v-model:column-filters="columnFilters"
            v-model:pagination="pagination"
            :pagination-options="{
                getPaginationRowModel: getPaginationRowModel()
            }"
        >
            <!-- Pass through all cell slots dynamically -->
            <template v-for="(_, slotName) in slots" :key="slotName" #[slotName]="slotProps">
                <slot :name="(slotName as any as any)" v-bind="slotProps || {}" />
            </template>
        </UTable>

        <!-- Empty State -->
        <template v-else>
            <slot name="empty">
                <UEmpty
                    :icon="emptyIcon"
                    :title="emptyTitle"
                    :description="emptyDescription"
                    variant="naked"
                >
                    <template v-if="slots['empty-actions']" #actions>
                        <slot name="empty-actions" />
                    </template>
                </UEmpty>
            </slot>
        </template>

        <template v-if="!loading && data?.length && (showPagination || showPageSizeSelector)" #footer>
            <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 text-sm text-muted">
                    <slot name="footer-left">
                        <USelect
                            v-if="showPageSizeSelector"
                            :items="pageSizeItems"
                            size="md"
                            class="min-w-18"
                            :default-value="defaultPageSize"
                            @update:model-value="handlePageSizeChange"
                        />
                    </slot>
                </div>

                <div class="flex items-center gap-1.5">
                    <slot name="footer-right">
                        <UPagination
                            v-if="showPagination"
                            :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
                            :items-per-page="table?.tableApi?.getState().pagination.pageSize"
                            :total="table?.tableApi?.getFilteredRowModel().rows.length"
                            @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)"
                        />
                    </slot>
                </div>
            </div>
        </template>
    </UCard>
</template>
