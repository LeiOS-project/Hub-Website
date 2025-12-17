<script lang="ts" setup>
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
    description: 'Manage OS Releases on LeiOS Hub'
});

const pathBreadcrumbItems = [
    { label: 'OS Releases', to: '/dashboard/admin/os-releases' },
    { label: os_release_version },
];

</script>

<template>
    <UDashboardPanel>
        <template #header>
            <DashboardPageHeader
                icon="i-lucide-rocket"
                :breadcrumb-items="pathBreadcrumbItems"
            />
        </template>


    </UDashboardPanel>
</template>