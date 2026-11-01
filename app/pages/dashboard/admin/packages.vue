<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from "@nuxt/ui";
import { watchDebounced } from "@vueuse/core";
import type {
	AdminPackage,
	AdminPackageFlag,
	AdminPackageSort,
	AdminPage,
} from "~/utils/adminTypes";

definePageMeta({
	layout: "dashboard",
});

useSeoMeta({
	title: "All Packages | LeiOS Hub",
	description: "Moderate and manage all packages",
});

const toast = useToast();
const route = useRoute();
const router = useRouter();

/** The API searches from 3 characters on. */
const MIN_SEARCH_LENGTH = 3;

const FLAG_ITEMS: { label: string; value: AdminPackageFlag | "all" }[] = [
	{ label: "All packages", value: "all" },
	{ label: "Hidden", value: "HIDDEN" },
	{ label: "Deprecated", value: "DEPRECATED" },
	{ label: "System-managed", value: "SYSTEM-MANAGED" },
];

const SORT_ITEMS: { label: string; value: AdminPackageSort }[] = [
	{ label: "Name (A–Z)", value: "name" },
	{ label: "Newest", value: "newest" },
	{ label: "Recently updated", value: "updated" },
];

const FLAG_STYLES: Record<
	AdminPackageFlag,
	{ label: string; color: "error" | "warning" | "neutral"; icon: string }
> = {
	HIDDEN: { label: "Hidden", color: "error", icon: "i-lucide-eye-off" },
	DEPRECATED: { label: "Deprecated", color: "warning", icon: "i-lucide-archive" },
	"SYSTEM-MANAGED": { label: "System", color: "neutral", icon: "i-lucide-cpu" },
};

// Initial filters come from the URL so filtered views can be linked and survive a reload.
const filters = reactive({
	search: typeof route.query.search === "string" ? route.query.search : "",
	publisher: typeof route.query.publisher === "string" ? route.query.publisher : "",
	flag: FLAG_ITEMS.find((i) => i.value === route.query.flag)?.value ?? "all",
	sort: SORT_ITEMS.find((i) => i.value === route.query.sort)?.value ?? "name",
});

const effectiveSearch = computed(() => {
	const search = filters.search.trim();
	return search.length >= MIN_SEARCH_LENGTH ? search : "";
});
const searchTooShort = computed(() => {
	const length = filters.search.trim().length;
	return length > 0 && length < MIN_SEARCH_LENGTH;
});

const page = ref(1);
const pageSize = ref(25);

const {
	data: packagesPage,
	loading,
	refresh,
} = await useAPILazyAsyncData<AdminPage<AdminPackage>>("admin-packages-list", async () => {
	const publisher = filters.publisher.trim();
	const res = await useAPI((api) =>
		api.getPackages({
			query: {
				searchString: effectiveSearch.value || undefined,
				publisherName: publisher || undefined,
				flag: filters.flag === "all" ? undefined : filters.flag,
				sort: filters.sort,
				limit: pageSize.value,
				offset: (page.value - 1) * pageSize.value,
			},
		}),
	);

	if (!res.success) {
		toast.add({ title: "Failed to load packages", description: res.message, color: "error" });
		return { items: [], total: 0 };
	}

	// The page ran past the end (e.g. after a delete): jump to the last page.
	if (res.data.items.length === 0 && res.data.total > 0 && page.value > 1) {
		page.value = Math.ceil(res.data.total / pageSize.value);
	}
	return res.data;
});

function reloadFromFirstPage() {
	router.replace({
		query: {
			search: effectiveSearch.value || undefined,
			publisher: filters.publisher.trim() || undefined,
			flag: filters.flag === "all" ? undefined : filters.flag,
			sort: filters.sort === "name" ? undefined : filters.sort,
		},
	});

	if (page.value !== 1) {
		page.value = 1; // the page watcher reloads
	} else {
		refresh();
	}
}

watch(page, () => refresh());
watch(pageSize, reloadFromFirstPage);
watch(() => [filters.flag, filters.sort], reloadFromFirstPage);
// Only reload when the effective search changes (typing the first two characters does nothing).
watchDebounced(effectiveSearch, reloadFromFirstPage, { debounce: 300 });
watchDebounced(() => filters.publisher.trim(), reloadFromFirstPage, { debounce: 300 });

const hasActiveFilters = computed(
	() =>
		filters.search.trim() !== "" ||
		filters.publisher.trim() !== "" ||
		filters.flag !== "all" ||
		filters.sort !== "name",
);

function resetFilters() {
	filters.search = "";
	filters.publisher = "";
	filters.flag = "all";
	filters.sort = "name";
}

const columns: TableColumn<AdminPackage>[] = [
	{ id: "package", header: "Package" },
	{ id: "publisher", header: "Publisher" },
	{ accessorKey: "flags", header: "Flags" },
	{ id: "stable", header: "Stable" },
	{ id: "testing", header: "Testing" },
	{ id: "last_release", header: "Last Release" },
	{ id: "actions", header: "", enableSorting: false, enableHiding: false },
];

function isSystemManaged(pkg: AdminPackage) {
	return pkg.flags.includes("SYSTEM-MANAGED");
}

function getRowActions(pkg: AdminPackage): DropdownMenuItem[][] {
	return [
		[
			{
				label: "Moderate…",
				icon: "i-lucide-shield-alert",
				disabled: isSystemManaged(pkg),
				onSelect: () => openModeration(pkg),
			},
		],
		[
			{
				label: "Public page",
				icon: "i-lucide-external-link",
				to: `/explore/${pkg.fullname}`,
			},
			{
				label: "Developer page",
				icon: "i-lucide-settings",
				to: `/dashboard/packages/${pkg.fullname}`,
			},
			{
				label: "Releases",
				icon: "i-lucide-tags",
				to: `/dashboard/packages/${pkg.fullname}/releases`,
			},
			{
				label: "Audit log",
				icon: "i-lucide-scroll-text",
				to: `/dashboard/admin/audit-log?target_type=package&target_id=${pkg.id}`,
			},
		],
		[
			{
				label: "Delete",
				icon: "i-lucide-trash-2",
				color: "error",
				disabled: isSystemManaged(pkg),
				onSelect: () => openDelete(pkg),
			},
		],
	];
}

// --- Moderation -----------------------------------------------------------------------------

const moderationOpen = ref(false);
const moderationTarget = ref<AdminPackage | null>(null);
const moderationSaving = ref(false);
const moderationForm = reactive({
	hidden: false,
	deprecated: false,
	note: "",
});

const moderationNoteEnabled = computed(() => moderationForm.hidden || moderationForm.deprecated);

function openModeration(pkg: AdminPackage) {
	moderationTarget.value = pkg;
	moderationForm.hidden = pkg.flags.includes("HIDDEN");
	moderationForm.deprecated = pkg.flags.includes("DEPRECATED");
	moderationForm.note = pkg.moderation_note ?? "";
	moderationOpen.value = true;
}

async function submitModeration() {
	const target = moderationTarget.value;
	if (!target) return;

	moderationSaving.value = true;
	const note = moderationForm.note.trim();
	const res = await useAPI((api) =>
		api.putAdminPackagesByFullPackageNameModeration({
			path: { fullPackageName: target.fullname },
			body: {
				hidden: moderationForm.hidden,
				deprecated: moderationForm.deprecated,
				// The API keeps a note only while the package is hidden or deprecated.
				note: moderationNoteEnabled.value && note ? note : null,
			},
		}),
	);
	moderationSaving.value = false;

	if (!res.success) {
		toast.add({
			title: "Failed to update the moderation",
			description: res.message,
			icon: "i-lucide-circle-alert",
			color: "error",
		});
		return;
	}

	toast.add({
		title: "Moderation updated",
		description: target.fullname,
		icon: "i-lucide-check",
		color: "success",
	});
	moderationOpen.value = false;
	await refresh();
}

// --- Delete ---------------------------------------------------------------------------------

const deleteConfirmOpen = ref(false);
const deleteTarget = ref<AdminPackage | null>(null);

function openDelete(pkg: AdminPackage) {
	deleteTarget.value = pkg;
	deleteConfirmOpen.value = true;
}

async function onDeletePackage() {
	const target = deleteTarget.value;
	if (!target) return;

	const res = await useAPI((api) =>
		api.deletePackagesByFullPackageName({ path: { fullPackageName: target.fullname } }),
	);
	if (!res.success) {
		toast.add({
			title: "Delete failed",
			description: res.message,
			icon: "i-lucide-circle-alert",
			color: "error",
		});
		// Throwing keeps the delete modal open (see DashboardDeleteModal).
		throw new Error(res.message);
	}

	toast.add({ title: "Package deleted", icon: "i-lucide-check", color: "success" });
	deleteTarget.value = null;
	await refresh();
}

function lastReleaseAt(pkg: AdminPackage) {
	// Typed `unknown` by the generated client; the API sends a timestamp or null.
	return typeof pkg.last_release_at === "number" ? pkg.last_release_at : null;
}

function publisherName(pkg: AdminPackage) {
	return pkg.fullname.split(".")[0] ?? "";
}

function publisherLabel(pkg: AdminPackage) {
	// Typed `unknown` by the generated client; the API sends the publisher's display name.
	return typeof pkg.publisher_display_name === "string"
		? pkg.publisher_display_name
		: publisherName(pkg);
}
</script>

<template>
	<UDashboardPanel>
		<template #header>
			<DashboardPageHeader
				title="All Packages"
				icon="i-lucide-package-search"
				description="Moderate and manage all packages"
			>
				<template #right>
					<UButton
						label="New Package"
						icon="i-lucide-plus"
						color="neutral"
						variant="subtle"
						to="/dashboard/packages/new"
					/>
				</template>
			</DashboardPageHeader>
		</template>

		<template #body>
			<DashboardPageBody>
				<DashboardDataTable
					:data="packagesPage?.items ?? []"
					:columns="columns"
					:loading="loading"
					:default-page-size="100"
					:empty-title="hasActiveFilters ? 'No matching packages' : 'No packages'"
					:empty-description="
						hasActiveFilters ? 'Try other filters.' : 'Packages appear here once publishers create them.'
					"
					empty-icon="i-lucide-package-x"
					@refresh="refresh()"
				>
					<template #header-left>
						<UInput
							v-model="filters.search"
							icon="i-lucide-search"
							placeholder="Search packages..."
							:color="searchTooShort ? 'warning' : 'primary'"
							:highlight="searchTooShort"
							class="w-full sm:w-auto sm:min-w-56"
						/>
						<span v-if="searchTooShort" class="text-xs text-amber-400">
							Type at least {{ MIN_SEARCH_LENGTH }} characters
						</span>
						<UInput
							v-model="filters.publisher"
							icon="i-lucide-building-2"
							placeholder="Publisher name"
							class="w-full sm:w-40"
						/>
						<USelect v-model="filters.flag" :items="FLAG_ITEMS" class="w-full sm:w-auto sm:min-w-40" />
						<USelect v-model="filters.sort" :items="SORT_ITEMS" class="w-full sm:w-auto sm:min-w-40" />
						<UButton
							v-if="hasActiveFilters"
							label="Reset"
							icon="i-lucide-x"
							color="neutral"
							variant="ghost"
							@click="resetFilters();"
						/>
					</template>

					<template #package-cell="{ row }">
						<div class="min-w-0 max-w-xs">
							<NuxtLink
								:to="`/dashboard/packages/${row.original.fullname}`"
								class="block truncate font-medium text-white hover:underline"
							>
								{{ row.original.display_name }}
							</NuxtLink>
							<p class="truncate font-mono text-xs text-slate-400">{{ row.original.fullname }}</p>
						</div>
					</template>

					<template #publisher-cell="{ row }">
						<div class="flex items-center gap-1.5">
							<NuxtLink
								:to="`/dashboard/admin/publishers?search=${encodeURIComponent(publisherName(row.original))}`"
								class="truncate text-sm text-slate-300 hover:text-primary-400 hover:underline"
							>
								{{ publisherLabel(row.original) }}
							</NuxtLink>
							<UTooltip v-if="row.original.publisher_verified_at" text="Verified publisher">
								<UIcon name="i-lucide-badge-check" class="size-4 shrink-0 text-primary-400" />
							</UTooltip>
						</div>
					</template>

					<template #flags-cell="{ row }">
						<div v-if="row.original.flags.length" class="flex flex-wrap gap-1">
							<UTooltip
								v-for="flag in row.original.flags"
								:key="flag"
								:text="
									flag !== 'SYSTEM-MANAGED' && row.original.moderation_note
										? row.original.moderation_note
										: FLAG_STYLES[flag].label
								"
							>
								<UBadge
									:color="FLAG_STYLES[flag].color"
									:icon="FLAG_STYLES[flag].icon"
									variant="soft"
									size="sm"
								>
									{{ FLAG_STYLES[flag].label }}
								</UBadge>
							</UTooltip>
						</div>
						<span v-else class="text-slate-500">—</span>
					</template>

					<template #stable-cell="{ row }">
						<div class="flex flex-wrap gap-1">
							<UBadge
								v-if="row.original.latest_stable_release.amd64"
								color="success"
								variant="soft"
								size="sm"
							>
								amd64 {{ row.original.latest_stable_release.amd64 }}
							</UBadge>
							<UBadge
								v-if="row.original.latest_stable_release.arm64"
								color="success"
								variant="soft"
								size="sm"
							>
								arm64 {{ row.original.latest_stable_release.arm64 }}
							</UBadge>
							<span
								v-if="!row.original.latest_stable_release.amd64 && !row.original.latest_stable_release.arm64"
								class="text-slate-500"
							>
								—
							</span>
						</div>
					</template>

					<template #testing-cell="{ row }">
						<div class="flex flex-wrap gap-1">
							<UBadge
								v-if="row.original.latest_testing_release.amd64"
								color="warning"
								variant="soft"
								size="sm"
							>
								amd64 {{ row.original.latest_testing_release.amd64 }}
							</UBadge>
							<UBadge
								v-if="row.original.latest_testing_release.arm64"
								color="warning"
								variant="soft"
								size="sm"
							>
								arm64 {{ row.original.latest_testing_release.arm64 }}
							</UBadge>
							<span
								v-if="!row.original.latest_testing_release.amd64 && !row.original.latest_testing_release.arm64"
								class="text-slate-500"
							>
								—
							</span>
						</div>
					</template>

					<template #last_release-cell="{ row }">
						<span class="whitespace-nowrap text-sm text-slate-400">
							{{ formatDate(lastReleaseAt(row.original)) }}
						</span>
					</template>

					<template #actions-cell="{ row }">
						<div class="flex items-center justify-end gap-1">
							<UTooltip
								:text="
									isSystemManaged(row.original)
										? 'System-managed packages cannot be moderated'
										: 'Moderate'
								"
							>
								<UButton
									icon="i-lucide-shield-alert"
									color="neutral"
									variant="ghost"
									size="xs"
									aria-label="Moderate"
									:disabled="isSystemManaged(row.original)"
									@click="openModeration(row.original);"
								/>
							</UTooltip>
							<UDropdownMenu
								:ui="{ viewport: 'main-bg-color' }"
								:items="getRowActions(row.original)"
							>
								<UButton
									icon="i-lucide-more-horizontal"
									color="neutral"
									variant="ghost"
									size="xs"
									aria-label="More actions"
								/>
							</UDropdownMenu>
						</div>
					</template>

					<template #empty-actions>
						<UButton
							v-if="hasActiveFilters"
							label="Reset filters"
							color="neutral"
							variant="subtle"
							@click="resetFilters();"
						/>
					</template>

					<template #footer-left>
						<AdminPageSizeSelect
							v-model:page-size="pageSize"
							:page="page"
							:total="packagesPage?.total ?? 0"
						/>
					</template>

					<template #footer-right>
						<UPagination
							v-model:page="page"
							:total="packagesPage?.total ?? 0"
							:items-per-page="pageSize"
							:sibling-count="1"
							show-edges
						/>
					</template>
				</DashboardDataTable>
			</DashboardPageBody>
		</template>
	</UDashboardPanel>

	<!-- Moderation -->
	<DashboardModal
		v-model:open="moderationOpen"
		:title="`Moderate ${moderationTarget?.fullname ?? ''}`"
		description="Hide or deprecate the package"
		icon="i-lucide-shield-alert"
		icon-color="amber"
	>
		<div class="space-y-5">
			<USwitch
				v-model="moderationForm.hidden"
				label="Hidden"
				description="Only site admins, the owner and the package's members can see it. It stays in the repositories."
			/>
			<USwitch
				v-model="moderationForm.deprecated"
				label="Deprecated"
				description="Stays listed, with a deprecation notice on the package page."
			/>
			<UFormField
				label="Note"
				:help="
					moderationNoteEnabled
						? 'Shown to admins; for deprecated packages also on the package page.'
						: 'Removed when the package is neither hidden nor deprecated.'
				"
			>
				<UTextarea
					v-model="moderationForm.note"
					:rows="3"
					:maxlength="500"
					autoresize
					:disabled="!moderationNoteEnabled"
					placeholder="e.g. Replaced by example.new-package"
					class="w-full"
				/>
			</UFormField>
		</div>

		<template #footer>
			<div class="flex justify-end gap-2">
				<UButton label="Cancel" color="neutral" variant="ghost" @click="moderationOpen = false;" />
				<UButton
					label="Save"
					icon="i-lucide-save"
					:loading="moderationSaving"
					@click="submitModeration();"
				/>
			</div>
		</template>
	</DashboardModal>

	<DashboardDeleteModal
		v-model:open="deleteConfirmOpen"
		title="Delete Package"
		:warning-text="`This deletes “${deleteTarget?.fullname ?? ''}” with all its releases and removes them from the LeiOS repositories. This cannot be undone.`"
		:on-delete="onDeletePackage"
	/>
</template>
