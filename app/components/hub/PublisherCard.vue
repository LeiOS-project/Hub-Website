<script setup lang="ts">
/** Publisher tile for the public publisher grid; the whole card links to the profile. */
import type { PublicPublisher } from "~/utils/hubTypes";

const props = defineProps<{
	publisher: PublicPublisher;
}>();

const homepageHost = computed(() => {
	if (!props.publisher.homepage_url) return null;
	try {
		return new URL(props.publisher.homepage_url).host;
	} catch {
		return null;
	}
});
</script>

<template>
	<article
		class="relative flex h-full flex-col rounded-xl border border-slate-800 bg-slate-900/50 p-5 transition duration-300 hover:-translate-y-1 hover:border-primary-400/50"
	>
		<div class="flex items-start gap-3">
			<UAvatar
				:alt="publisher.display_name || publisher.name"
				size="lg"
				class="shrink-0 bg-primary-500/10 text-primary-400"
			/>
			<div class="min-w-0 flex-1">
				<div class="flex items-center gap-1.5">
					<h3 class="min-w-0 truncate font-semibold text-white">
						<NuxtLink
							:to="`/publishers/${publisher.name}`"
							class="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-primary-400"
						>
							{{ publisher.display_name || publisher.name }}
						</NuxtLink>
					</h3>
					<div class="relative z-10 flex">
						<HubVerifiedBadge :verified-at="publisher.verified_at" />
					</div>
				</div>
				<p class="truncate font-mono text-xs text-slate-500">@{{ publisher.name }}</p>
			</div>
		</div>

		<p class="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-400">
			{{ markdownToPlainText(publisher.description) || "No description provided." }}
		</p>

		<p v-if="homepageHost" class="mt-4 flex items-center gap-1.5 truncate text-xs text-slate-500">
			<UIcon name="i-lucide-globe" class="size-3.5 shrink-0" />
			<span class="truncate">{{ homepageHost }}</span>
		</p>
	</article>
</template>
