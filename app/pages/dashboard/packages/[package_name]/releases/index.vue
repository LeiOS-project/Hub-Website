<script lang="ts" setup>
import type { NavigationMenuItem, TableColumn } from '@nuxt/ui';
import type { GetDevPackagesPackageNameReleasesResponses, GetDevPackagesPackageNameResponses } from '~/api-client';

const toast = useToast();

type DevPackage = GetDevPackagesPackageNameResponses[200]['data'];
type Release = GetDevPackagesPackageNameReleasesResponses[200]['data'][number];

const pkgData = useSubrouterInjectedData<DevPackage>("package").inject().data;

const package_releases = await useAPIAsyncData(
    `/dev/packages/${pkgData.value.name}/releases`,
    async () => {
        const res = await useAPI((api) => api.getDevPackagesPackageNameReleases({
            path: {
                packageName: pkgData.value.name
            }
        }));

        if (!res.success) {
            toast.add({
                title: 'Error',
                description: `Failed to load releases for package ${pkgData.value.name}: ${res.message}`,
                color: 'error'
            });
            return [];
        }

        // // mock data
        // for (let i = 0; i < 50; i++) {
        //     res.data.push({
        //         id: i,
        //         versionWithLeiosPatch: `1.0.${i}`,
        //         created_at: Date.now() - i * 1000 * 60 * 60 * 24,
        //         architectures: ['amd64', 'arm64']
        //     });
        // }

        return res.data.reverse();
    }
);

const packageReleasesTableColumns: TableColumn<Release>[] = [
    { accessorKey: 'versionWithLeiosPatch', header: 'Version' },
    { accessorKey: 'created_at', header: 'Created At' },
    { accessorKey: 'architectures', header: 'Architectures' }
]

</script>

<template>
    <DashboardPageBody>

        <DashboardDataTable
            :data="package_releases.data"
            :columns="packageReleasesTableColumns"
            :loading="package_releases.loading"
            :filters="[
                {
                    column: 'versionWithLeiosPatch',
                    type: 'text',
                    placeholder: 'Search version...'
                },
                {
                    column: 'created_at',
                    type: 'date',
                    placeholder: 'Filter by created date'
                }
            ]"
            empty-title="No releases"
            empty-description="Create the first release to get started."
            empty-icon="i-lucide-package"
            @refresh="package_releases.refresh()"
        >

            <template #header-right>
                <UButton
                    :to="`/dashboard/packages/${pkgData.name}/releases/new`"
                    label="New Release"
                    icon="i-lucide-plus"
                    color="primary"
                />
            </template>

            <template #versionWithLeiosPatch-cell="{ row }">
                <NuxtLink
                    :to="`/dashboard/packages/${pkgData.name}/releases/${row.original.versionWithLeiosPatch}`"
                    class="font-medium text-primary-400 hover:underline"
                >
                    {{ row.original.versionWithLeiosPatch }}
                </NuxtLink>
            </template>

            <template #created_at-cell="{ row }">
                <span class="text-sm">
                    {{ new Date(row.original.created_at).toLocaleString() }}
                </span>
            </template>

            <template #architectures-cell="{ row }">
                <div class="flex gap-1">
                    <UBadge v-if="row.original.architectures.amd64" color="warning" variant="soft" size="sm">
                        amd64
                    </UBadge>
                    <UBadge v-if="row.original.architectures.arm64" color="warning" variant="soft" size="sm">
                        arm64
                    </UBadge>
                    <UBadge v-if="!row.original.architectures.amd64 && !row.original.architectures.arm64" color="neutral" variant="soft" size="sm">
                        None
                    </UBadge>
                </div>
            </template>

            <template #empty-actions>
                <UButton
                    :to="`/dashboard/packages/${pkgData.name}/releases/new`"
                    label="New Release"
                    icon="i-lucide-plus"
                    color="primary"
                />
            </template>

        </DashboardDataTable>

    </DashboardPageBody>
</template>