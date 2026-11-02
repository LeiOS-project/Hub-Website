<script lang="ts" setup>
/**
 * Layout for one OS release (`/dashboard/admin/os-releases/:version`, plus its logs) and for the
 * new-release form (`/dashboard/admin/os-releases/new`). Loads the release and provides it to the
 * child pages as `os_release`.
 */
import type { GetAdminOsReleasesByVersionResponses } from "~/api-client";
import type { UseSubrouterPathDynamics } from "~/composables/useSubrouterPathDynamics";

const route = useRoute();

const os_release_version = route.params.os_release_version as string;

type OSRelease = GetAdminOsReleasesByVersionResponses["200"]["data"];
/** The new-release form loads its own data (the stable queue). */
type NewOSRelease = Record<string, never>;

definePageMeta({
	layout: "dashboard",
});

let error = null;

if (os_release_version === "new") {
	useSubrouterInjectedData<OSRelease, NewOSRelease>("os_release", true).provide({
		data: ref({}),
		refresh: async () => void 0,
		loading: ref(false),
		isNew: true,
	});
} else {
	const {
		data: result,
		refresh,
		loading,
	} = await useAPIAsyncData(
		`admin-os-release:${os_release_version}`,
		async () =>
			await useAPI((api) =>
				api.getAdminOsReleasesByVersion({ path: { version: os_release_version } }),
			),
	);

	if (!result.value?.success || !result.value?.data) {
		error = createError({
			statusCode: result.value?.code || 500,
			statusMessage: result.value?.message || "Failed to load OS Release data",
		});
	}

	const data = computed(() => result.value?.data as OSRelease);

	useSubrouterInjectedData<OSRelease, NewOSRelease>("os_release", true).provide({
		data,
		refresh,
		loading,
		isNew: false,
	});
}

function getRoutesConfig(): UseSubrouterPathDynamics.RoutesConfig {
	return os_release_version === "new"
		? {
				[`/dashboard/admin/os-releases/new`]: {
					isNavLink: true,
					label: "New release",
					icon: "i-lucide-rocket",
					exact: true,
					getDynamicValues() {
						return {
							seoSettings: {
								title: `New OS Release`,
								description: `Create a LeiOS release from the stable queue`,
							},
							breadcrumbItems: [{ label: "New Release" }],
						};
					},
				},
			}
		: {
				[`/dashboard/admin/os-releases/${os_release_version}`]: {
					isNavLink: true,
					label: "General",
					icon: "i-lucide-info",
					exact: true,
					getDynamicValues() {
						return {
							seoSettings: {
								title: `Release ${os_release_version}`,
								description: `LeiOS release ${os_release_version}`,
							},
							breadcrumbItems: [{ label: os_release_version }],
						};
					},
				},
				[`/dashboard/admin/os-releases/${os_release_version}/logs`]: {
					isNavLink: true,
					label: "Logs",
					icon: "i-lucide-file-text",
					to: `/dashboard/admin/os-releases/${os_release_version}/logs`,
					getDynamicValues() {
						return {
							seoSettings: {
								title: `Logs | Release ${os_release_version}`,
								description: `Publishing logs of LeiOS release ${os_release_version}`,
							},
							breadcrumbItems: [
								{ label: os_release_version, to: `/dashboard/admin/os-releases/${os_release_version}` },
								{ label: "Logs" },
							],
						};
					},
				},
			};
}

const subrouterPathDynamics = useSubrouterPathDynamics({
	baseTitle: `OS Releases | LeiOS Hub`,
	basebreadcrumbItems: [{ label: "OS Releases", to: "/dashboard/admin/os-releases" }],
	routes: getRoutesConfig(),
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
				<NuxtPage v-if="!error" />
                <UError v-else-if="error" :error="error" />
			</div>
		</template>

    </UDashboardPanel>
</template>
