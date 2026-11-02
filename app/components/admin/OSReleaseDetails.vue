<script setup lang="ts">
/**
 * One OS release: publishing state, the package releases it moved into stable, and its release
 * notes (editable by admins).
 */
import type { GetAdminOsReleasesByVersionResponses } from "~/api-client";
import { useUserInfoStore } from "~/composables/stores/useUserStore";

type OSRelease = GetAdminOsReleasesByVersionResponses["200"]["data"];

const props = defineProps<{
	release: OSRelease;
	/** Reloads the release after a change. */
	refresh: () => Promise<unknown>;
}>();

const toast = useToast();
const user = await useUserInfoStore().use();
const isAdmin = computed(() => user.value?.role === "admin");

const isPublishing = computed(() =>
	["pending", "running", "paused"].includes(props.release.publishing_status),
);

// While it publishes, reload now and then to show the result.
let pollTimer: ReturnType<typeof setInterval> | undefined;
watch(
	isPublishing,
	(publishing) => {
		clearInterval(pollTimer);
		if (publishing && import.meta.client) pollTimer = setInterval(() => props.refresh(), 5000);
	},
	{ immediate: true },
);
onBeforeUnmount(() => clearInterval(pollTimer));

// Release notes
const editing = ref(false);
const draft = ref("");
const saving = ref(false);

function startEditing() {
	draft.value = props.release.changelog;
	editing.value = true;
}

async function save() {
	saving.value = true;
	const res = await useAPI((api) =>
		api.putAdminOsReleasesByVersion({
			path: { version: props.release.version },
			body: { changelog: draft.value.trim() },
		}),
	);
	saving.value = false;

	if (!res.success) {
		toast.add({
			title: "Failed to save the release notes",
			description: res.message,
			icon: "i-lucide-circle-alert",
			color: "error",
		});
		return;
	}
	toast.add({ title: "Release notes saved", icon: "i-lucide-check", color: "success" });
	editing.value = false;
	await props.refresh();
}
</script>

<template>
	<div class="mx-auto w-full space-y-6 lg:max-w-4xl">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div>
				<h2 class="text-xl font-semibold text-white">LeiOS {{ release.version }}</h2>
				<p class="mt-1 text-sm text-slate-400">
					Created {{ formatDate(release.created_at) }}
					<template v-if="release.published_at"> · published {{ formatDate(release.published_at) }}</template>
				</p>
			</div>
			<AdminStatusBadge :status="release.publishing_status" size="lg" />
		</div>

		<UAlert
			v-if="release.publishing_status === 'failed'"
			color="error"
			variant="subtle"
			icon="i-lucide-circle-x"
			title="Publishing failed"
			description="The included releases stay in the stable queue. Check the logs, then create a new release."
			:actions="[{ label: 'Open logs', to: `/dashboard/admin/os-releases/${release.version}/logs` }]"
		/>
		<UAlert
			v-else-if="isPublishing"
			color="info"
			variant="subtle"
			icon="i-lucide-loader-circle"
			title="Publishing"
			description="The packages move into stable and the repository is published. This page updates by itself."
		/>

		<DashboardSectionCard
			title="Packages"
			:description="`${release.package_count} ${release.package_count === 1 ? 'release' : 'releases'} moved into stable`"
			icon="i-lucide-package"
			flush
		>
			<UEmpty
				v-if="!release.packages.length"
				variant="naked"
				icon="i-lucide-package-open"
				title="No package changes"
				description="This release only rebuilt the branding package."
				class="py-8"
			/>
			<ul v-else class="divide-y divide-slate-800">
				<li
					v-for="pkg in release.packages"
					:key="`${pkg.package_fullname}-${pkg.version_with_leios_patch}`"
					class="flex flex-wrap items-center justify-between gap-2 px-6 py-3"
				>
					<NuxtLink
						:to="`/explore/${pkg.package_fullname}`"
						class="font-mono text-sm text-slate-200 hover:text-primary-400 hover:underline"
					>
						{{ pkg.package_fullname }}
					</NuxtLink>
					<NuxtLink
						v-if="pkg.package_release_id !== null"
						:to="`/dashboard/packages/${pkg.package_fullname}/releases/${pkg.version_with_leios_patch}`"
						class="font-mono text-sm text-slate-400 hover:text-primary-400 hover:underline"
					>
						{{ pkg.version_with_leios_patch }}
					</NuxtLink>
					<UTooltip v-else text="This release was deleted later">
						<span class="font-mono text-sm text-slate-500 line-through">{{ pkg.version_with_leios_patch }}</span>
					</UTooltip>
				</li>
			</ul>
		</DashboardSectionCard>

		<DashboardSectionCard title="Release notes" icon="i-lucide-scroll-text">
			<template #actions>
				<UButton
					v-if="isAdmin && !editing"
					label="Edit"
					icon="i-lucide-pencil"
					color="neutral"
					variant="ghost"
					size="sm"
					@click="startEditing()"
				/>
			</template>

			<div v-if="editing" class="space-y-3">
				<MarkdownEditor v-model="draft" :disabled="saving" min-height-class="min-h-64" />
				<div class="flex justify-end gap-2">
					<UButton label="Cancel" color="neutral" variant="ghost" :disabled="saving" @click="editing = false;" />
					<UButton
						label="Save"
						icon="i-lucide-save"
						:loading="saving"
						:disabled="!draft.trim()"
						@click="save()"
					/>
				</div>
			</div>
			<MarkdownContent v-else :value="release.changelog" />
		</DashboardSectionCard>
	</div>
</template>
