<script lang="ts" setup>
/** A package's releases with their architectures and where each one stands on its way to stable. */
import type { TableColumn } from "@nuxt/ui";
import type {
	GetPackagesByFullPackageNameReleasesResponses,
	GetPackagesByFullPackageNameResponses,
} from "~/api-client";

const toast = useToast();

type DevPackage = GetPackagesByFullPackageNameResponses[200]["data"];
type Release = GetPackagesByFullPackageNameReleasesResponses[200]["data"][number];

const pkgData = useSubrouterInjectedData<DevPackage>("package").inject().data;

const package_releases = await useAPIAsyncData(
	`/dev/packages/${pkgData.value.fullname}/releases`,
	async () => {
		const res = await useAPI((api) =>
			api.getPackagesByFullPackageNameReleases({
				path: {
					fullPackageName: pkgData.value.fullname,
				},
			}),
		);

		if (!res.success) {
			toast.add({
				title: "Error",
				description: `Failed to load releases for package ${pkgData.value.name}: ${res.message}`,
				color: "error",
			});
			return [];
		}

		return [...res.data].sort((a, b) => b.created_at - a.created_at);
	},
);

/** Stable status of a release; `none` without a request. Versions in stable now count as `stable`. */
function stableState(release: Release) {
	const stable = pkgData.value.latest_stable_release;
	const version = release.version_with_leios_patch;
	if (stable.amd64 === version || stable.arm64 === version) return "stable";
	return release.stable_promotion?.status ?? "none";
}

const packageReleasesTableColumns: TableColumn<Release>[] = [
	{ accessorKey: "version_with_leios_patch", header: "Version" },
	{ accessorKey: "created_at", header: "Created At" },
	{ accessorKey: "architectures", header: "Architectures" },
	{ accessorKey: "stable_promotion", header: "Stable" },
];

const STABLE_FILTER_OPTIONS = [
	{ label: "In stable now", value: "stable" },
	{ label: "Queued for stable", value: "queued" },
	{ label: "Awaiting review", value: "pending" },
	{ label: "Released earlier", value: "released" },
	{ label: "Denied", value: "denied" },
	{ label: "Not requested", value: "none" },
];
</script>

<template>
    <DashboardPageBody>

        <DashboardDataTable
            :data="package_releases.data"
            :columns="packageReleasesTableColumns"
            :loading="package_releases.loading"
            :filters="[
                {
                    column: 'version_with_leios_patch',
                    type: 'text',
                    placeholder: 'Search version...'
                },
                {
                    column: 'stable_promotion',
                    type: 'multi-select',
                    placeholder: 'Stable status',
                    icon: 'i-lucide-filter',
                    options: STABLE_FILTER_OPTIONS,
                    filterFn: (row, _columnId, filterValue) =>
                        !Array.isArray(filterValue) || filterValue.length === 0 || filterValue.includes(stableState(row.original)),
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
                    :to="`/dashboard/packages/${pkgData.fullname}/releases/new`"
                    label="New Release"
                    icon="i-lucide-plus"
                    color="primary"
                />
            </template>

            <template #version_with_leios_patch-cell="{ row }">
                <NuxtLink
                    :to="`/dashboard/packages/${pkgData.fullname}/releases/${row.original.version_with_leios_patch}`"
                    class="font-medium text-primary-400 hover:underline"
                >
                    {{ row.original.version_with_leios_patch }}
                </NuxtLink>
            </template>

            <template #created_at-cell="{ row }">
                <span class="text-sm">
                    {{ formatDate(row.original.created_at) }}
                </span>
            </template>

            <template #architectures-cell="{ row }">
                <div class="flex gap-1">
                    <UBadge v-if="row.original.architectures.is_all" color="warning" variant="soft" size="sm">
                        all
                    </UBadge>
                    <template v-else>
                        <UBadge v-if="row.original.architectures.amd64" color="warning" variant="soft" size="sm">
                            amd64
                        </UBadge>
                        <UBadge v-if="row.original.architectures.arm64" color="warning" variant="soft" size="sm">
                            arm64
                        </UBadge>
                    </template>
                    <UBadge v-if="!row.original.architectures.amd64 && !row.original.architectures.arm64 && !row.original.architectures.is_all" color="neutral" variant="soft" size="sm">
                        None
                    </UBadge>
                </div>
            </template>

            <template #stable_promotion-cell="{ row }">
                <div class="flex flex-wrap items-center gap-1">
                    <UBadge v-if="stableState(row.original) === 'stable'" color="success" variant="solid" size="sm" icon="i-lucide-shield-check">
                        In stable
                    </UBadge>
                    <NuxtLink
                        v-if="row.original.stable_promotion"
                        :to="`/dashboard/packages/${pkgData.fullname}/releases/${row.original.version_with_leios_patch}/stable-promotion-requests`"
                    >
                        <HubStableStatusBadge
                            :status="row.original.stable_promotion.status"
                            :os-release-version="row.original.stable_promotion.os_release_version"
                        />
                    </NuxtLink>
                    <span v-else-if="stableState(row.original) !== 'stable'" class="text-sm text-slate-500">—</span>
                </div>
            </template>

            <template #empty-actions>
                <UButton
                    :to="`/dashboard/packages/${pkgData.fullname}/releases/new`"
                    label="New Release"
                    icon="i-lucide-plus"
                    color="primary"
                />
            </template>

        </DashboardDataTable>

    </DashboardPageBody>
</template>
