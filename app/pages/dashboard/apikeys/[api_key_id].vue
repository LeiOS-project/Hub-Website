<script setup lang="ts">
import type { UseSubrouterPathDynamics } from '~/composables/useSubrouterPathDynamics';


definePageMeta({
    layout: 'dashboard'
});

const route = useRoute();


const api_key_id = route.params.api_key_id as string;

let error = null;

if (!api_key_id) {
    error = createError({ statusCode: 400, statusMessage: 'API Key ID is required' });
}

if (api_key_id === "new") {

    useSubrouterInjectedData<number, NewAPIKey>('api_key', true).provide({
        data: ref({
            description: '',
            expires_at: "30d"
        }),
        isNew: true
    });

} else {
    error = createError({
        statusCode: 404,
        statusMessage: `API Key ${api_key_id} cannot be edited at this time.`
    });
}

function getRoutesConfig(): UseSubrouterPathDynamics.RoutesConfig {

    return api_key_id === "new" ? {
        [`/dashboard/apikeys/new`]: {
            isNavLink: true,
            label: 'General',
            icon: 'i-lucide-info',
            exact: true,
            getDynamicValues() {
                return {
                    seoSettings: {
                        title: `New API Key`,
                        description: `Create a new API Key on LeiOS Hub`
                    },
                    breadcrumbItems: [
                        { label: 'New API Key' }
                    ]
                };
            }
        }
    } : {
        [`/dashboard/apikeys/${api_key_id}`]: {
            isNavLink: true,
            label: 'General',
            icon: 'i-lucide-info',
            exact: true,
            getDynamicValues() {
                return {
                    seoSettings: {
                        title: `API Key ${api_key_id}`,
                        description: `Manage API Key ${api_key_id} on LeiOS Hub`
                    },
                    breadcrumbItems: [
                        { label: api_key_id }
                    ]
                };
            }
        }
    };
}

const subrouterPathDynamics = useSubrouterPathDynamics({
    baseTitle: `API Keys | LeiOS Hub`,
    basebreadcrumbItems: [
        { label: 'API Keys', to: '/dashboard/apikeys' }
    ],      
    routes: getRoutesConfig()
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
                icon="i-lucide-key"
                :breadcrumb-items="routePathDynamicValues.breadcrumbItems"
            />

            <UDashboardToolbar>
				<!-- NOTE: The `-mx-1` class is used to align with the `DashboardSidebarCollapse` button here. -->
				<UNavigationMenu :items="subrouterPathDynamics.links" highlight class="-mx-1 flex-1" />
			</UDashboardToolbar>

        </template>

        <template #body>
			<div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full">
				<NuxtPage v-if="!error" />
                <UError v-else-if="error" :error="error" />
			</div>
		</template>

    </UDashboardPanel>
</template>