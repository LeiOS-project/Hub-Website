<script setup lang="ts">
/**
 * Package tile for the public grids (landing page, explore, publisher profile). The whole card
 * links to the package page (a stretched link), the publisher line links to the publisher.
 */
import type { PublicPackage, PublicPackageChannelVersions } from "~/utils/hubTypes";

const props = withDefaults(
	defineProps<{
		pkg: PublicPackage;
		/** Hide the "by <publisher>" line, e.g. on the publisher's own profile. */
		showPublisher?: boolean;
	}>(),
	{
		showPublisher: true,
	},
);

// A package's full name is `<publisherName>.<packageName>`; publisher names never contain dots.
const publisherName = computed(() => props.pkg.fullname.split(".")[0] ?? "");
const publisherLabel = computed(() => props.pkg.publisher_display_name || publisherName.value);
const isDeprecated = computed(() => props.pkg.flags.includes("DEPRECATED"));

/** One label for a channel: the shared version, or both when the architectures differ. */
function channelVersionLabel(versions: PublicPackageChannelVersions) {
	const { amd64, arm64 } = versions;
	if (amd64 && arm64 && amd64 !== arm64) return `${amd64} (amd64) · ${arm64} (arm64)`;
	return amd64 ?? arm64 ?? null;
}

const stableVersion = computed(() => channelVersionLabel(props.pkg.latest_stable_release));
const testingVersion = computed(() => channelVersionLabel(props.pkg.latest_testing_release));
</script>

<template>
	<article
		class="relative flex h-full flex-col rounded-xl border border-slate-800 bg-slate-900/50 p-5 transition duration-300 hover:-translate-y-1 hover:border-primary-400/50"
	>
		<div class="flex items-start gap-3">
			<div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-500/10">
				<UIcon name="i-lucide-package" class="text-xl text-primary-400" />
			</div>
			<div class="min-w-0 flex-1">
				<div class="flex items-start justify-between gap-2">
					<h3 class="min-w-0 truncate font-semibold text-white">
						<NuxtLink
							:to="`/explore/${pkg.fullname}`"
							class="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-primary-400"
						>
							{{ pkg.display_name || pkg.name }}
						</NuxtLink>
					</h3>
					<UBadge
						v-if="isDeprecated"
						color="warning"
						variant="soft"
						size="sm"
						icon="i-lucide-archive"
						class="shrink-0"
					>
						Deprecated
					</UBadge>
				</div>
				<p class="truncate font-mono text-xs text-slate-500">{{ pkg.fullname }}</p>
			</div>
		</div>

		<div
			v-if="showPublisher"
			class="relative z-10 mt-3 flex w-fit max-w-full items-center gap-1 text-sm text-slate-400"
		>
			<span class="shrink-0">by</span>
			<NuxtLink
				:to="`/publishers/${publisherName}`"
				class="truncate text-slate-300 transition-colors hover:text-primary-400"
			>
				{{ publisherLabel }}
			</NuxtLink>
			<HubVerifiedBadge :verified-at="pkg.publisher_verified_at" size="sm" />
		</div>

		<p class="mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-400">
			{{ markdownToPlainText(pkg.description) || "No description provided." }}
		</p>

		<div class="mt-4 flex flex-wrap items-center gap-2">
			<UBadge v-if="stableVersion" color="success" variant="subtle" size="sm" class="max-w-full">
				<span class="truncate">Stable {{ stableVersion }}</span>
			</UBadge>
			<UBadge v-if="testingVersion" color="info" variant="subtle" size="sm" class="max-w-full">
				<span class="truncate">Testing {{ testingVersion }}</span>
			</UBadge>
			<span v-if="!stableVersion && !testingVersion" class="text-xs text-slate-500">
				No releases yet
			</span>
		</div>
	</article>
</template>
