<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui';
import type { GetAdminOsReleasesResponses } from '~/api-client';

const toast = useToast();
const route = useRoute();

const os_release_version = route.params.os_release_version as string;

const title = `Release ${os_release_version} | OS Releases`;

type OSRelease = GetAdminOsReleasesResponses["200"]["data"][number];

definePageMeta({
    layout: 'dashboard'
});

useSeoMeta({
    title: `${title} | LeiOS Hub`,
    description: `Manage OS Release ${os_release_version} on LeiOS Hub`
});

// const { data: result, refresh, pending, error } = await useAsyncData(
//     `admin-os-release:${os_release_version}`,
//     async () => {
//         // const res = await useAPI((api) => api.getAdminOsReleasesVersion({
//         //     path: {
//         //         version: os_release_version
//         //     }
//         // }));
//         // return res;
//         return {
//             success: true,
//             data: {
//                 id: 1,
//                 version: os_release_version,
//                 created_at: Date.now() - 1000 * 60 * 60 * 24 * 7,
//                 published_at: Date.now() - 1000 * 60 * 60 * 24 * 3,
//                 publishing_status: 'completed' as OSRelease['publishing_status'],
//             } satisfies OSRelease
//         };
//     }
// )

// const data = computed(() => result.value?.data);

// provide('os_release_data', data);
// provide('os_release_refresh', refresh);
// provide('os_release_pending', pending);

const pathBreadcrumbItems = [
    { label: 'OS Releases', to: '/dashboard/admin/os-releases' },
    { label: os_release_version },
];

const links = [[
    {
        label: 'General',
        icon: 'i-lucide-info',
        to: `/dashboard/admin/os-releases/${os_release_version}`,
        exact: true
    },
    {
        label: 'Logs',
        icon: 'i-lucide-file-text',
        to: `/dashboard/admin/os-releases/${os_release_version}/logs`
    }
]] satisfies NavigationMenuItem[][]

</script>

<template>
    <div class="space-y-6">

        <h1>hi</h1>

    </div>
</template>