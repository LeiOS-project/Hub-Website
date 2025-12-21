<script lang="ts" setup>
import type { BreadcrumbItem, NavigationMenuItem } from '@nuxt/ui';
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

const { data: result, refresh, pending, error } = await useAsyncData(
    `admin-os-release:${os_release_version}`,
    async () => {
        // const res = await useAPI((api) => api.getAdminOsReleasesVersion({
        //     path: {
        //         version: os_release_version
        //     }
        // }));
        // return res;
        return {
            success: true,
            data: {
                id: 1,
                version: os_release_version,
                created_at: Date.now() - 1000 * 60 * 60 * 24 * 7,
                published_at: Date.now() - 1000 * 60 * 60 * 24 * 3,
                publishing_status: 'completed' as OSRelease['publishing_status'],
            } satisfies OSRelease
        };
    }
)

const data = computed(() => result.value?.data);

provide('os_release_data', data);
provide('os_release_refresh', refresh);
provide('os_release_pending', pending);

// const pathBreadcrumbItems = [
//     { label: 'OS Releases', to: '/dashboard/admin/os-releases' },
//     { label: os_release_version },
// ];

const pathBreadcrumbItems = computed<BreadcrumbItem[]>(() => {
    const items: BreadcrumbItem[] = [
        { label: 'OS Releases', to: '/dashboard/admin/os-releases' },
    ];

    const normalizedPath = route.path.replace(/\/$/, '');

    if (normalizedPath.endsWith('/logs')) {
        items.push(
            { label: os_release_version, to: `/dashboard/admin/os-releases/${os_release_version}` },
            { label: 'Logs' }
        );
    } else {
        items.push(
            { label: os_release_version }
        );
    }

    return items;
});

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
    <UDashboardPanel>
        <template #header>
            <DashboardPageHeader
                icon="i-lucide-rocket"
                :breadcrumb-items="pathBreadcrumbItems"
            />

            <UDashboardToolbar>
				<!-- NOTE: The `-mx-1` class is used to align with the `DashboardSidebarCollapse` button here. -->
				<UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
			</UDashboardToolbar>

        </template>

        <template #body>
			<div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full">
				<NuxtPage v-if="result?.success" />
                <UError v-else-if="error" :error="error" />
			</div>
		</template>

    </UDashboardPanel>
</template>