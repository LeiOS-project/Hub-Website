<script setup lang="ts">
/**
 * Create an OS release: pick which queued releases go into stable (all by default, or only some,
 * e.g. a security fix), generate release notes from the selection, edit them and publish.
 * Admins only; moderators see the queue but cannot publish.
 */
import { useUserInfoStore } from "~/composables/stores/useUserStore";
import type { AdminStableRequest } from "~/utils/adminTypes";

const toast = useToast();
const user = await useUserInfoStore().use();
const isAdmin = computed(() => user.value?.role === "admin");

const QUEUE_LIMIT = 100;

const {
	data: queue,
	loading: queueLoading,
	refresh: refreshQueue,
} = await useAPILazyAsyncData<{ items: AdminStableRequest[]; total: number }>(
	"admin-os-release-new:queue",
	async () => {
		const res = await useAPI((api) =>
			api.getAdminStablePromotionRequests({
				query: { status: "queued", order: "oldest", limit: QUEUE_LIMIT },
			}),
		);
		if (!res.success) {
			toast.add({
				title: "Failed to load the stable queue",
				description: res.message,
				color: "error",
			});
			return { items: [], total: 0 };
		}
		return res.data;
	},
);

const queueItems = computed(() => queue.value?.items ?? []);

// An OS release that is still publishing blocks a new one (the API refuses it too).
const { data: publishing } = await useAPILazyAsyncData(
	"admin-os-release-new:publishing",
	async () => {
		const res = await useAPI((api) =>
			api.getAdminOsReleases({ query: { limit: 10, order: "newest" } }),
		);
		if (!res.success) return null;
		return (
			res.data.items.find((release) =>
				["pending", "running", "paused"].includes(release.publishing_status),
			) ?? null
		);
	},
);

// Selection: everything in the queue until the admin unticks something.
const selected = ref<number[]>([]);
let selectionInitialized = false;
watch(
	queueItems,
	(items) => {
		if (selectionInitialized || !queue.value) return;
		selectionInitialized = true;
		selected.value = items.map((item) => item.id);
	},
	{ immediate: true },
);

const allSelected = computed(
	() => queueItems.value.length > 0 && selected.value.length === queueItems.value.length,
);
const selectAllState = computed(() =>
	allSelected.value ? true : selected.value.length > 0 ? ("indeterminate" as const) : false,
);

function toggleAll(value: boolean | "indeterminate") {
	selected.value = value === true ? queueItems.value.map((item) => item.id) : [];
}

function toggle(id: number, value: boolean | "indeterminate") {
	selected.value =
		value === true
			? [...new Set([...selected.value, id])]
			: selected.value.filter((selectedId) => selectedId !== id);
}

/** Packages queued with more than one release: the newest selected one ends up in stable. */
const queuedTwice = computed(() => {
	const counts = new Map<number, number>();
	for (const item of queueItems.value)
		counts.set(item.package_id, (counts.get(item.package_id) ?? 0) + 1);
	return new Set([...counts].filter(([, count]) => count > 1).map(([id]) => id));
});

function previousVersion(item: AdminStableRequest) {
	return item.package_latest_stable_release.amd64 ?? item.package_latest_stable_release.arm64;
}

function architectures(item: AdminStableRequest) {
	const archs = item.package_release_architectures;
	if (archs.is_all) return ["all"];
	return (["amd64", "arm64"] as const).filter((arch) => archs[arch]);
}

// Release notes
const changelog = ref("");
const version = ref<string | null>(null);
const generating = ref(false);
/** The selection the current notes were generated for, to notice when it changed. */
const notesSelectionKey = ref<string | null>(null);
const selectionKey = computed(() => [...selected.value].sort((a, b) => a - b).join(","));
const notesOutdated = computed(
	() => notesSelectionKey.value !== null && notesSelectionKey.value !== selectionKey.value,
);
const replaceNotesOpen = ref(false);

async function generateNotes() {
	generating.value = true;
	const ids = [...selected.value];
	const res = await useAPI((api) =>
		api.postAdminOsReleasesGenerateChangelog({ body: { stable_promotion_request_ids: ids } }),
	);
	generating.value = false;
	replaceNotesOpen.value = false;

	if (!res.success) {
		toast.add({
			title: "Failed to generate release notes",
			description: res.message,
			icon: "i-lucide-circle-alert",
			color: "error",
		});
		return;
	}
	version.value = res.data.version;
	changelog.value = res.data.changelog;
	notesSelectionKey.value = selectionKey.value;
}

/** Generates notes, asking first when that would replace text in the editor. */
function requestNotes() {
	if (changelog.value.trim()) {
		replaceNotesOpen.value = true;
		return;
	}
	generateNotes();
}

// Prefill the notes once the queue is known.
watch(
	() => queue.value,
	(value) => {
		if (value && !changelog.value && notesSelectionKey.value === null && isAdmin.value) {
			generateNotes();
		}
	},
	{ immediate: true },
);

// Publish
const confirmOpen = ref(false);
const creating = ref(false);

const canCreate = computed(
	() => isAdmin.value && !publishing.value && changelog.value.trim().length > 0 && !creating.value,
);

async function create() {
	creating.value = true;
	const res = await useAPI((api) =>
		api.postAdminOsReleases({
			body: { changelog: changelog.value.trim(), stable_promotion_request_ids: [...selected.value] },
		}),
	);
	creating.value = false;

	if (!res.success) {
		confirmOpen.value = false;
		toast.add({
			title: "Failed to create the OS release",
			description: res.message,
			icon: "i-lucide-circle-alert",
			color: "error",
		});
		return;
	}

	toast.add({
		title: `LeiOS ${res.data.version} is being published`,
		description: `${res.data.package_count} ${res.data.package_count === 1 ? "release moves" : "releases move"} into stable.`,
		icon: "i-lucide-rocket",
		color: "success",
	});
	confirmOpen.value = false;
	await navigateTo(`/dashboard/admin/os-releases/${res.data.version}`);
}
</script>

<template>
	<div class="mx-auto w-full space-y-6 lg:max-w-4xl">
		<div>
			<h2 class="text-xl font-semibold text-white">New OS release</h2>
			<p class="mt-1 text-sm text-slate-400">
				Moves the releases you pick from the stable queue into stable, publishes the stable
				repository and records the release notes.
			</p>
		</div>

		<UAlert
			v-if="!isAdmin"
			color="neutral"
			variant="subtle"
			icon="i-lucide-shield"
			title="Only administrators can publish OS releases"
			description="You can still review the queue and take releases out of it."
			:actions="[{ label: 'Open the stable queue', to: '/dashboard/admin/stable-promotion-requests?status=queued' }]"
		/>

		<UAlert
			v-if="publishing"
			color="warning"
			variant="subtle"
			icon="i-lucide-loader-circle"
			:title="`LeiOS ${publishing.version} is still being published`"
			description="Wait until it finished before you create the next release."
			:actions="[{ label: 'Open it', to: `/dashboard/admin/os-releases/${publishing.version}` }]"
		/>

		<!-- Packages -->
		<DashboardSectionCard
			title="Packages"
			:description="
				queueItems.length
					? `${selected.length} of ${queueItems.length} queued ${queueItems.length === 1 ? 'release' : 'releases'} selected`
					: 'Releases approved for stable'
			"
			icon="i-lucide-list-ordered"
			flush
		>
			<template #actions>
				<UButton
					icon="i-lucide-refresh-cw"
					color="neutral"
					variant="ghost"
					size="sm"
					aria-label="Reload the queue"
					:loading="queueLoading"
					@click="refreshQueue()"
				/>
			</template>

			<div v-if="queueLoading && !queue" class="space-y-2 p-6">
				<USkeleton class="h-10 w-full" />
				<USkeleton class="h-10 w-full" />
			</div>

			<UEmpty
				v-else-if="!queueItems.length"
				variant="naked"
				icon="i-lucide-inbox"
				title="The stable queue is empty"
				description="You can still publish a release without package changes, for example to refresh the branding package."
				class="py-10"
			/>

			<div v-else>
				<label
					class="flex cursor-pointer items-center gap-3 border-b border-slate-800 px-6 py-3 text-sm text-slate-300"
				>
					<UCheckbox
						:model-value="selectAllState"
						aria-label="Select all queued releases"
						@update:model-value="toggleAll($event)"
					/>
					Select all
				</label>

				<ul class="divide-y divide-slate-800">
					<li v-for="item in queueItems" :key="item.id">
						<label
							class="flex cursor-pointer items-start gap-3 px-6 py-3 transition-colors hover:bg-slate-800/40"
						>
							<UCheckbox
								class="mt-1"
								:model-value="selected.includes(item.id)"
								:aria-label="`Include ${item.package_fullname} ${item.package_release_version}`"
								@update:model-value="toggle(item.id, $event)"
							/>
							<div class="min-w-0 flex-1 space-y-1">
								<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
									<span class="font-medium text-white">{{ item.package_display_name }}</span>
									<span class="font-mono text-xs text-slate-500">{{ item.package_fullname }}</span>
									<UBadge
										v-for="arch in architectures(item)"
										:key="arch"
										color="neutral"
										variant="outline"
										size="xs"
									>
										{{ arch }}
									</UBadge>
									<UTooltip
										v-if="queuedTwice.has(item.package_id)"
										text="Another release of this package is queued too. If you include both, the newer one ends up in stable."
									>
										<UBadge color="warning" variant="soft" size="xs" icon="i-lucide-copy">
											Queued twice
										</UBadge>
									</UTooltip>
								</div>
								<p class="font-mono text-sm text-slate-300">
									<template v-if="previousVersion(item)">
										<span class="text-slate-500">{{ previousVersion(item) }}</span>
										→
									</template>
									{{ item.package_release_version }}
									<UBadge v-if="!previousVersion(item)" color="success" variant="soft" size="xs">
										New in stable
									</UBadge>
								</p>
								<p class="text-xs text-slate-500">
									Queued {{ formatDate(item.status_changed_at ?? item.created_at) }}
									<template v-if="item.status_changed_by_username">
										by @{{ item.status_changed_by_username }}
									</template>
								</p>
							</div>
							<UButton
								:to="`/dashboard/admin/stable-promotion-requests/${item.id}`"
								icon="i-lucide-message-square-text"
								color="neutral"
								variant="ghost"
								size="xs"
								aria-label="Open the request"
								@click.stop
							/>
						</label>
					</li>
				</ul>

				<p v-if="(queue?.total ?? 0) > QUEUE_LIMIT" class="px-6 py-3 text-xs text-slate-500">
					Showing the {{ QUEUE_LIMIT }} oldest of {{ queue?.total }} queued releases.
				</p>
			</div>
		</DashboardSectionCard>

		<!-- Release notes -->
		<DashboardSectionCard
			title="Release notes"
			:description="version ? `LeiOS ${version}` : 'What changed in this release'"
			icon="i-lucide-scroll-text"
		>
			<template #actions>
				<UButton
					label="Generate from selection"
					icon="i-lucide-sparkles"
					color="neutral"
					variant="outline"
					size="sm"
					:loading="generating"
					:disabled="!isAdmin"
					@click="requestNotes()"
				/>
			</template>

			<div class="space-y-3">
				<UAlert
					v-if="notesOutdated"
					color="info"
					variant="subtle"
					icon="i-lucide-info"
					description="You changed the selection after generating the notes."
					:actions="[{ label: 'Regenerate', onClick: () => requestNotes() }]"
				/>
				<MarkdownEditor
					v-model="changelog"
					:disabled="!isAdmin || creating"
					placeholder="Describe the release, or generate notes from the selected packages."
					min-height-class="min-h-64"
				/>
				<p class="text-xs text-slate-500">
					Shown on the Hub's releases page and, as plain text, in the changelog of the LeiOS
					branding package.
				</p>
			</div>
		</DashboardSectionCard>

		<div class="flex justify-end">
			<UButton
				label="Create OS release"
				icon="i-lucide-rocket"
				size="lg"
				:disabled="!canCreate"
				@click="confirmOpen = true;"
			/>
		</div>

		<DashboardModal
			v-model:open="replaceNotesOpen"
			title="Replace the release notes?"
			description="The generated notes replace what is in the editor now."
			icon="i-lucide-sparkles"
		>
			<template #footer>
				<div class="flex justify-end gap-2">
					<UButton label="Cancel" color="neutral" variant="ghost" @click="replaceNotesOpen = false;" />
					<UButton label="Replace" icon="i-lucide-sparkles" :loading="generating" @click="generateNotes()" />
				</div>
			</template>
		</DashboardModal>

		<DashboardModal
			v-model:open="confirmOpen"
			:title="`Publish LeiOS ${version ?? ''}?`"
			description="The stable repository is published to every LeiOS installation"
			icon="i-lucide-rocket"
		>
			<p class="text-sm text-slate-300">
				<template v-if="selected.length">
					{{ selected.length }} {{ selected.length === 1 ? "release moves" : "releases move" }}
					into stable.
				</template>
				<template v-else>No package changes: only the branding package is rebuilt.</template>
				<template v-if="selected.length < queueItems.length">
					{{ queueItems.length - selected.length }} queued
					{{ queueItems.length - selected.length === 1 ? "release stays" : "releases stay" }} in the
					queue for a later release.
				</template>
			</p>

			<template #footer>
				<div class="flex justify-end gap-2">
					<UButton label="Cancel" color="neutral" variant="ghost" :disabled="creating" @click="confirmOpen = false;" />
					<UButton label="Publish" icon="i-lucide-rocket" :loading="creating" @click="create()" />
				</div>
			</template>
		</DashboardModal>
	</div>
</template>
