<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui';
import type { GetAdminOsReleasesResponses } from '~/api-client';

const toast = useToast();
const route = useRoute();

const os_release_version = route.params.os_release_version as string;

const title = `Logs | Release ${os_release_version} | OS Releases`;

type OSRelease = GetAdminOsReleasesResponses["200"]["data"][number];

useSeoMeta({
    title: `${title} | LeiOS Hub`,
    description: 'Manage OS Releases on LeiOS Hub'
});

const os_release = inject<Ref<OSRelease>>('os_release_data') as Ref<OSRelease>;
const os_release_refresh = inject<() => Promise<void>>('os_release_refresh');
const os_release_pending = inject<Ref<boolean>>('os_release_pending');

const {
    data: os_release_publishing_logs,
    refresh: os_release_publishing_logs_refresh,
    pending: os_release_publishing_logs_loading,
    error: os_release_publishing_logs_error
} = await useAsyncData(`admin-os-release:${os_release_version}:logs`, async () => {
    const res = await useAPI((api) => api.getAdminOsReleasesVersionPublishingLogs({
        path: {
            version: os_release_version
        }
    }));
    return res.data;
});

</script>

<template>
    
    <div class="space-y-6">



    </div>

</template>
