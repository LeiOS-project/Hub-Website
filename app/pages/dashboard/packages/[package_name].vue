<script lang="ts" setup>
import type { GetDevPackagesResponses, PostDevPackagesData } from '~/api-client';

const toast = useToast();
const route = useRoute();

const package_name = route.params.package_name as string;

type Package = GetDevPackagesResponses["200"]["data"][number];
type NewPackage = PostDevPackagesData["body"];

definePageMeta({
    layout: 'dashboard'
});

let error = null;

if (package_name === "new") {

    const data = ref<NewPackage>({
        name: "",
        description: "",
        homepage_url: "",
        requires_patching: false
    });
    const loading = ref(false);
    const refresh = async () => null;

    provide('package_data', data);
    provide('package_refresh', refresh);
    provide('package_loading', loading);
    provide('package_is_new', true);

} else {
    const { data: result, refresh, loading } = await useAPIAsyncData(
        `dev-package:${package_name}`,
        async () => {
            const res = await useAPI((api) => api.getDevPackagesPackageName({
                path: {
                    packageName: package_name
                }
            }));
            return res;
        }
    )

    if (!result.value?.success || !result.value?.data) {
        error = createError({
            statusCode: result.value?.code || 500,
            statusMessage: result.value?.message || 'Failed to load package data'
        });
    }

    const data = computed(() => result.value?.data as Package);

    provide('package_data', data satisfies Ref<Package>);
    provide('package_refresh', refresh);
    provide('package_loading', loading);
    provide('package_is_new', false);
}


// const pathDynamicValues = computed(() => {
//     const breadcrumbItems: BreadcrumbItem[] = [
//         { label: 'Packages', to: '/dashboard/packages' },
//     ];

//     let seoSettings: Parameters<typeof useSeoMeta>[0] = {};

//     const normalizedPath = route.path.replace(/\/$/, '');

//     if (normalizedPath.endsWith('/releases')) {

//         seoSettings = {
//             title: `Releases | ${package_name} | Packages | LeiOS Hub`,
//             description: `Manage releases for the package ${package_name} on LeiOS Hub`
//         };

//         breadcrumbItems.push(
//             { label: package_name, to: `/dashboard/packages/${package_name}` },
//             { label: 'Releases' }
//         );

//     } else if (normalizedPath.endsWith('/stable-promotion-requests')) {

//         seoSettings = {
//             title: `Stable Promotion Requests | ${package_name} | Packages | LeiOS Hub`,
//             description: `Manage stable promotion requests for the package ${package_name} on LeiOS Hub`
//         };

//         breadcrumbItems.push(
//             { label: package_name, to: `/dashboard/packages/${package_name}` },
//             { label: 'Stable Promotion Requests' }
//         );

//     } else {

//         seoSettings = {
//             title: `${package_name} | Packages | LeiOS Hub`,
//             description: `Manage the package ${package_name} on LeiOS Hub`
//         };

//         breadcrumbItems.push({ label: package_name });
//     }

//     useSeoMeta(seoSettings);

//     return { breadcrumbItems };
// });

// const links = [[
//     {
//         label: 'General',
//         icon: 'i-lucide-info',
//         to: `/dashboard/packages/${package_name}`,
//         exact: true
//     },
//     {
//         label: 'Releases',
//         icon: 'i-lucide-file-text',
//         to: `/dashboard/packages/${package_name}/releases`,
//     },
//     {
//         label: 'Stable Promotion Requests',
//         icon: 'i-lucide-git-pull-request',
//         to: `/dashboard/packages/${package_name}/stable-promotion-requests`,
//     }
// ]] satisfies NavigationMenuItem[][];

const subrouterPathDynamics = useSubrouterPathDynamics({
    baseTitle: `${package_name} | Packages | LeiOS Hub`,
    basebreadcrumbItems: [
        { label: 'Packages', to: '/dashboard/packages' },
    ],
    routes: {
        [`/dashboard/packages/${package_name}`]: {
            isNavLink: true,
            label: 'General',
            icon: 'i-lucide-info',
            exact: true,
            getDynamicValues() {
                return {
                    breadcrumbItems: [
                        { label: package_name }
                    ],
                    seoSettings: {
                        description: `Manage the package ${package_name} on LeiOS Hub`
                    }
                };
            }
        },
        [`/dashboard/packages/${package_name}/releases`]: {
            isNavLink: true,
            label: 'Releases',
            icon: 'i-lucide-file-text',
            getDynamicValues() {
                return {
                    breadcrumbItems: [
                        { label: package_name, to: `/dashboard/packages/${package_name}` },
                        { label: 'Releases' }
                    ],
                    seoSettings: {
                        title: `Releases`,
                        description: `Manage releases for the package ${package_name} on LeiOS Hub`
                    }
                };
            }
        },
        [`/dashboard/packages/${package_name}/stable-promotion-requests`]: {
            isNavLink: true,
            label: 'Stable Promotion Requests',
            icon: 'i-lucide-git-pull-request',
            to: `/dashboard/packages/${package_name}/stable-promotion-requests`,
            getDynamicValues() {
                return {
                    breadcrumbItems: [
                        { label: package_name, to: `/dashboard/packages/${package_name}` },
                        { label: 'Stable Promotion Requests' }
                    ],
                    seoSettings: {
                        title: `Stable Promotion Requests`,
                        description: `Manage stable promotion requests for the package ${package_name} on LeiOS Hub`
                    }
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
                icon="i-lucide-package"
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