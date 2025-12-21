<script setup lang="ts">
import type { GetDevPackagesPackageNameResponses, GetDevPackagesPackageNameReleasesResponses, GetDevPackagesPackageNameStablePromotionRequestsResponses } from '@/api-client/types.gen'
import type { BreadcrumbItem } from '@nuxt/ui'

type DevPackage = GetDevPackagesPackageNameResponses[200]['data']
type Release = GetDevPackagesPackageNameReleasesResponses[200]['data'][number]
type StableRequest = GetDevPackagesPackageNameStablePromotionRequestsResponses[200]['data'][number]

definePageMeta({
    layout: 'dashboard'
})

const route = useRoute()
const toast = useToast()
const package_name = route.params.package_name as string

useSeoMeta({
    title: `${package_name} | Packages | LeiOS Hub`,
    description: `Manage package ${package_name}`
})

const showUploadModal = ref(route.query.action === 'upload')
const showStableModal = ref(false)

const archOptions = [
    { label: 'amd64', value: 'amd64' },
    { label: 'arm64', value: 'arm64' }
]

const pkg = inject<Ref<DevPackage>>('package_data') as Ref<DevPackage>;
const loadingPkg = inject<Ref<boolean>>('package_loading') as Ref<boolean>;
const package_refresh = inject<() => Promise<void>>('package_refresh');

// Fetch releases
const { data: releases, pending: loadingReleases, refresh: refreshReleases } = await useAsyncData<Release[]>(
    `dev-package-${package_name}-releases`,
    async () => {
        const res = await useAPI((api) => api.getDevPackagesPackageNameReleases({ path: { packageName: package_name } }))
        if (!res.success) {
            return []
        }
        return res.data
    }
)

// Fetch stable requests
const { data: stableRequests, refresh: refreshStableRequests } = await useAsyncData<StableRequest[]>(
    `dev-package-${package_name}-stable-requests`,
    async () => {
        const res = await useAPI((api) => api.getDevPackagesPackageNameStablePromotionRequests({ path: { packageName: package_name } }))
        if (!res.success) {
            return []
        }
        return res.data
    }
)





function getStatusColor(status: StableRequest['status']) {
    switch (status) {
        case 'approved': return 'success'
        case 'denied': return 'error'
        default: return 'warning'
    }
}

const breadcrumbItems = ref<BreadcrumbItem[]>([
    { label: 'Packages', to: '/dashboard/packages' },
    { label: package_name }
]);

</script>

<template>
    <!-- <UDashboardPanel>
        <template #header>
            <UDashboardNavbar :title="`${packageName}`" icon="i-lucide-package">
                <template #title>
                    <UBreadcrumb
                        :items="breadcrumbItems"
                        :ui='{
                            link: "text-md"
                        }'
                    />
                    <UButton
                        icon="i-lucide-arrow-left"
                        variant="ghost"
                        color="neutral"
                        to="/dashboard/packages"
                    />
                </template>
                <template #right>
                    <div class="flex gap-2">
                        <UButton
                            label="Request Stable"
                            icon="i-lucide-git-pull-request"
                            color="neutral"
                            variant="outline"
                            @click="showStableModal = true"
                        />
                        <UButton
                            label="Upload Release"
                            icon="i-lucide-upload"
                            color="primary"
                            @click="showUploadModal = true"
                        />
                    </div>
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="space-y-6"> -->
                <div v-if="loadingPkg" class="flex items-center justify-center py-12">
                    <UIcon name="i-lucide-loader-2" class="animate-spin text-3xl text-slate-400" />
                </div>

                <template v-else-if="pkg">
                    <!-- Package Info -->
                    <UCard class="border-slate-800 bg-slate-900/60">
                        <template #header>
                            <h2 class="text-lg font-semibold flex items-center gap-2">
                                <UIcon name="i-lucide-info" class="text-sky-400" />
                                Package Information
                            </h2>
                        </template>

                        <div class="grid gap-4 sm:grid-cols-2">
                            <div>
                                <p class="text-sm text-slate-400">Description</p>
                                <p class="mt-1">{{ pkg.description || '—' }}</p>
                            </div>
                            <div>
                                <p class="text-sm text-slate-400">Homepage</p>
                                <UButton
                                    v-if="pkg.homepage_url"
                                    :to="pkg.homepage_url"
                                    target="_blank"
                                    :label="pkg.homepage_url"
                                    variant="link"
                                    color="primary"
                                    class="mt-1 p-0"
                                />
                                <p v-else class="mt-1">—</p>
                            </div>
                            <div>
                                <p class="text-sm text-slate-400">Stable Release (amd64)</p>
                                <p class="mt-1 font-mono">{{ pkg.latest_stable_release_amd64 || '—' }}</p>
                            </div>
                            <div>
                                <p class="text-sm text-slate-400">Stable Release (arm64)</p>
                                <p class="mt-1 font-mono">{{ pkg.latest_stable_release_arm64 || '—' }}</p>
                            </div>
                            <div>
                                <p class="text-sm text-slate-400">Testing Release (amd64)</p>
                                <p class="mt-1 font-mono">{{ pkg.latest_testing_release_amd64 || '—' }}</p>
                            </div>
                            <div>
                                <p class="text-sm text-slate-400">Testing Release (arm64)</p>
                                <p class="mt-1 font-mono">{{ pkg.latest_testing_release_arm64 || '—' }}</p>
                            </div>
                        </div>
                    </UCard>

                    <!-- Releases -->
                    <UCard class="border-slate-800 bg-slate-900/60">
                        <template #header>
                            <div class="flex items-center justify-between">
                                <h2 class="text-lg font-semibold flex items-center gap-2">
                                    <UIcon name="i-lucide-archive" class="text-emerald-400" />
                                    Releases
                                </h2>
                                <UButton
                                    label="Refresh"
                                    icon="i-lucide-refresh-cw"
                                    variant="ghost"
                                    color="neutral"
                                    size="sm"
                                    @click="refreshReleases()"
                                />
                            </div>
                        </template>

                        <div v-if="loadingReleases" class="flex items-center justify-center py-8">
                            <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl text-slate-400" />
                        </div>

                        <div v-else-if="releases?.length" class="space-y-3">
                            <div
                                v-for="release in releases"
                                :key="release.id"
                                class="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 p-4"
                            >
                                <div class="flex items-center gap-4">
                                    <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800">
                                        <UIcon name="i-lucide-file-archive" class="text-slate-400" />
                                    </div>
                                    <div>
                                        <p class="font-medium font-mono">{{ release.versionWithLeiosPatch }}</p>
                                        <p class="text-sm text-slate-400">{{ release.architecture }}</p>
                                    </div>
                                </div>
                                <UBadge color="info" variant="soft">
                                    {{ release.architecture }}
                                </UBadge>
                            </div>
                        </div>

                        <UEmpty
                            v-else
                            icon="i-lucide-archive-x"
                            title="No releases"
                            description="Upload your first release to get started."
                        >
                            <template #actions>
                                <UButton
                                    label="Upload Release"
                                    color="primary"
                                    @click="showUploadModal = true"
                                />
                            </template>
                        </UEmpty>
                    </UCard>

                    <!-- Stable Requests -->
                    <UCard class="border-slate-800 bg-slate-900/60">
                        <template #header>
                            <div class="flex items-center justify-between">
                                <h2 class="text-lg font-semibold flex items-center gap-2">
                                    <UIcon name="i-lucide-git-pull-request" class="text-amber-400" />
                                    Stable Promotion Requests
                                </h2>
                                <UButton
                                    label="Refresh"
                                    icon="i-lucide-refresh-cw"
                                    variant="ghost"
                                    color="neutral"
                                    size="sm"
                                    @click="refreshStableRequests()"
                                />
                            </div>
                        </template>

                        <div v-if="stableRequests?.length" class="space-y-3">
                            <div
                                v-for="request in stableRequests"
                                :key="request.id"
                                class="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 p-4"
                            >
                                <div class="flex items-center gap-4">
                                    <div>
                                        <p class="font-medium">Request #{{ request.id }}</p>
                                        <p class="text-sm text-slate-400">Release ID: {{ request.package_release_id }}</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <UBadge :color="getStatusColor(request.status)" variant="soft">
                                        {{ request.status }}
                                    </UBadge>
                                    <UTooltip v-if="request.admin_note" :text="request.admin_note">
                                        <UIcon name="i-lucide-message-circle" class="text-slate-400" />
                                    </UTooltip>
                                </div>
                            </div>
                        </div>

                        <UEmpty
                            v-else
                            icon="i-lucide-git-pull-request"
                            title="No requests"
                            description="Submit a stable promotion request when your release is ready."
                        />
                    </UCard>
                </template>
            <!-- </div>
        </template>
    </UDashboardPanel> -->

</template>
