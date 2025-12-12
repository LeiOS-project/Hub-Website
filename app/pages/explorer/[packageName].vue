<script setup lang="ts">
import type { TableColumn } from '#ui/types'

const toast = useToast()
const route = useRoute()
const router = useRouter()

const repoOptions = [
    { label: 'All repositories', value: 'all' },
    { label: 'Archive', value: 'leios-archive' },
    { label: 'Testing', value: 'leios-testing' },
    { label: 'Stable', value: 'leios-stable' }
]

const repo = ref<'all' | 'leios-archive' | 'leios-testing' | 'leios-stable'>('all')

const { data: pkgData, pending, refresh } = await useAsyncData(
    () => `public-package-${route.params.packageName}-${repo.value}`,
    async () => {
        const res = await useAPI(
            (api) =>
                api.getPublicPackagesPackageName({
                    path: { packageName: route.params.packageName as string },
                    ...(repo.value === 'all' ? {} : { query: { repo: repo.value } })
                }),
            true
        )

        if (!res.success) {
            toast.add({ title: 'Failed to load package', description: res.message, color: 'error' })
            if (Number(res.code) === 404) {
                router.push('/explorer')
            }
            return null
        }
        return res.data
    },
    { watch: [repo] }
)

const packageInfo = computed(() => pkgData.value?.package)
const packageTitle = computed(() => packageInfo.value?.name || (route.params.packageName as string))

const releases = computed(() => {
    if (!pkgData.value?.releases) return []
    const reposToShow = repo.value === 'all' ? Object.keys(pkgData.value.releases) : [repo.value]
    const rows: ReleaseRow[] = []

    for (const repoName of reposToShow) {
        const versions = (pkgData.value.releases as any)[repoName] || {}
        for (const versionKey of Object.keys(versions)) {
            const arches = versions[versionKey]
            for (const arch of ['amd64', 'arm64'] as const) {
                const build = arches?.[arch]
                if (build) {
                    rows.push({
                        repo: repoName,
                        version: build.version,
                        arch: build.architecture,
                        description: build.description,
                        maintainer: build.maintainer
                    })
                }
            }
        }
    }

    return rows
})

type ReleaseRow = {
    repo: string
    version: string
    arch: string
    description?: string
    maintainer?: string
}

const releaseColumns: TableColumn<ReleaseRow>[] = [
    { accessorKey: 'repo', header: 'Repository' },
    { accessorKey: 'version', header: 'Version' },
    { accessorKey: 'arch', header: 'Arch' },
    { accessorKey: 'description', header: 'Description' },
    { accessorKey: 'maintainer', header: 'Maintainer' }
]
</script>

<template>
    <div class="bg-slate-950/40 py-12">
        <UContainer class="space-y-8">
            <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div class="space-y-2">
                    <UBadge color="primary" variant="soft">Explorer</UBadge>
                    <div class="flex items-center gap-3">
                        <UButton icon="i-lucide-arrow-left" to="/explorer" variant="ghost" color="neutral" size="sm">Back</UButton>
                        <h1 class="text-3xl font-bold">{{ packageTitle }}</h1>
                    </div>
                    <p class="text-slate-400">View public metadata and releases for this package.</p>
                </div>
                <div class="flex items-center gap-2">
                    <USelect v-model="repo" :items="repoOptions" class="w-48" />
                    <UButton icon="i-lucide-refresh-cw" variant="ghost" :loading="pending" @click="() => refresh()">Refresh</UButton>
                </div>
            </div>

            <UCard class="border-slate-800 bg-slate-900/60">
                <div class="space-y-4 p-5">
                    <div v-if="pending" class="flex items-center gap-2 text-slate-400">
                        <UIcon name="i-lucide-loader-2" class="animate-spin" /> Loading package...
                    </div>

                    <div v-else-if="!packageInfo" class="text-slate-400">
                        Package not found.
                    </div>

                    <template v-else>
                        <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div class="space-y-2">
                                <h2 class="text-2xl font-semibold">{{ packageInfo.name }}</h2>
                                <p class="text-slate-400">{{ packageInfo.description || 'No description provided.' }}</p>
                                <div class="flex flex-wrap gap-2">
                                    <UBadge color="neutral" variant="soft">owner #{{ packageInfo.owner_user_id }}</UBadge>
                                    <UButton v-if="packageInfo.homepage_url" size="sm" variant="ghost" color="neutral" :to="packageInfo.homepage_url" target="_blank" icon="i-lucide-external-link">Homepage</UButton>
                                </div>
                            </div>
                        </div>

                        <div class="mt-6 space-y-3">
                            <div class="flex items-center justify-between">
                                <h3 class="text-xl font-semibold">Releases</h3>
                                <UBadge color="neutral" variant="soft">{{ releases.length }} entries</UBadge>
                            </div>

                            <div v-if="!releases.length" class="text-slate-400">No releases for this selection.</div>

                            <UTable v-else :data="releases" :columns="releaseColumns" />
                        </div>
                    </template>
                </div>
            </UCard>
        </UContainer>
    </div>
</template>
