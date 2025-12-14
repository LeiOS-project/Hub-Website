<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

definePageMeta({
    layout: 'dashboard'
})

useSeoMeta({
    title: 'OS Releases | LeiOS Hub',
    description: 'Manage OS Releases on LeiOS Hub'
})

const links = [[{
	label: 'General',
	icon: 'i-lucide-user',
	to: '/dashboard/settings',
	exact: true
}, {
	label: 'Security',
	icon: 'i-lucide-shield',
	to: '/dashboard/settings/security'
}]] satisfies NavigationMenuItem[][]

</script>

<template>
    <UDashboardPanel>
        <template #header>
            <UDashboardNavbar title="OS Releases" icon="i-lucide-rocket">
                <!-- <template #right>
                    <UButton
                        label="New Package"
                        icon="i-lucide-plus"
                        color="primary"
                        @click="showCreateModal = true"
                    />
                </template> -->
            </UDashboardNavbar>
        </template>

        <!-- <template #body>
            <div class="space-y-6">
                <div
                    v-if="loading"
                    class="flex items-center justify-center py-12"
                >
                    <UIcon
                        name="i-lucide-loader-2"
                        class="animate-spin text-3xl text-slate-400"
                    />
                </div>

                <UTable
                    v-else-if="packages?.length"
                    :data="packages"
                    :columns="packageColumns"
                >
                    <template #id-cell="{ row }">
                        <span class="font-mono text-sm"
                            >#{{ row.original.id }}</span
                        >
                    </template>
                    <template #name-cell="{ row }">
                        <span class="font-medium text-sky-400">{{
                            row.original.name
                        }}</span>
                    </template>
                    <template #owner_user_id-cell="{ row }">
                        <span class="font-mono text-sm text-slate-400"
                            >#{{ row.original.owner_user_id }}</span
                        >
                    </template>
                    <template #description-cell="{ row }">
                        <span class="text-slate-400 line-clamp-1 max-w-xs">
                            {{ row.original.description || "—" }}
                        </span>
                    </template>
                    <template #stable-cell="{ row }">
                        <div class="flex gap-1">
                            <UBadge
                                v-if="row.original.latest_stable_release_amd64"
                                color="success"
                                variant="soft"
                                size="sm"
                            >
                                amd64
                            </UBadge>
                            <UBadge
                                v-if="row.original.latest_stable_release_arm64"
                                color="success"
                                variant="soft"
                                size="sm"
                            >
                                arm64
                            </UBadge>
                            <span
                                v-if="
                                    !row.original.latest_stable_release_amd64 &&
                                    !row.original.latest_stable_release_arm64
                                "
                                class="text-slate-500"
                                >—</span
                            >
                        </div>
                    </template>
                    <template #testing-cell="{ row }">
                        <div class="flex gap-1">
                            <UBadge
                                v-if="row.original.latest_testing_release_amd64"
                                color="warning"
                                variant="soft"
                                size="sm"
                            >
                                amd64
                            </UBadge>
                            <UBadge
                                v-if="row.original.latest_testing_release_arm64"
                                color="warning"
                                variant="soft"
                                size="sm"
                            >
                                arm64
                            </UBadge>
                            <span
                                v-if="
                                    !row.original
                                        .latest_testing_release_amd64 &&
                                    !row.original.latest_testing_release_arm64
                                "
                                class="text-slate-500"
                                >—</span
                            >
                        </div>
                    </template>
                    <template #actions-cell="{ row }">
                        <UDropdownMenu
                            :ui="{
                                viewport: 'main-bg-color',
                            }"
                            :items="getAdminPackageRowActions(row)"
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
        </template> -->
    </UDashboardPanel>

    
</template>
