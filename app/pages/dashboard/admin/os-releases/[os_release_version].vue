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


const subrouterPathDynamics = useSubrouterPathDynamics({
    baseTitle: `OS Release ${os_release_version} | OS Releases | LeiOS Hub`,
    basebreadcrumbItems: [
        { label: 'OS Releases', to: '/dashboard/admin/os-releases' }
    ],
    routes: {
        [`/dashboard/admin/os-releases/${os_release_version}`]: {
            isNavLink: true,
            label: 'General',
            icon: 'i-lucide-info',
            exact: true,
            getDynamicValues() {
                return {
                    seoSettings: {
                        title: `Release ${os_release_version} | OS Releases | LeiOS Hub`,
                        description: `Manage OS Release ${os_release_version} on LeiOS Hub`
                    },
                    breadcrumbItems: [
                        { label: os_release_version }
                    ]
                };
            }
        },
        [`/dashboard/admin/os-releases/${os_release_version}/logs`]: {
            isNavLink: true,
            label: 'Logs',
            icon: 'i-lucide-file-text',
            to: `/dashboard/admin/os-releases/${os_release_version}/logs`,
            getDynamicValues() {
                return {
                    seoSettings: {
                        title: `Logs`,
                        description: `View logs for OS Release ${os_release_version} on LeiOS Hub`
                    },
                    breadcrumbItems: [
                        { label: os_release_version, to: `/dashboard/admin/os-releases/${os_release_version}` },
                        { label: 'Logs' }
                    ]
                };
            }
        }
    }
});

const routePathDynamicValues = await useAwaitedComputed(async () => {
    const values = await subrouterPathDynamics.getPathDynamicValues(route.path);
    useSeoMeta(values.seoSettings);
    return values;
});

</script>

<template>
    <UDashboardPanel>
        <template #header>
            <DashboardPageHeader
                icon="i-lucide-rocket"
                :breadcrumb-items="routePathDynamicValues.breadcrumbItems"
            />

            <UDashboardToolbar>
				<!-- NOTE: The `-mx-1` class is used to align with the `DashboardSidebarCollapse` button here. -->
				<UNavigationMenu :items="subrouterPathDynamics.links" highlight class="-mx-1 flex-1" />
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