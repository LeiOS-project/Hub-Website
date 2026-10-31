<script setup lang="ts">
/**
 * One label/value row of a detail list. Put the rows in a `divide-y divide-slate-800` container;
 * they stack on narrow screens.
 */
defineProps<{
	label: string;
	description?: string;
}>();
</script>

<template>
	<div
		class="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
	>
		<div class="shrink-0">
			<p class="text-sm font-medium text-slate-300">{{ label }}</p>
			<p v-if="description" class="text-xs text-slate-500">{{ description }}</p>
		</div>
		<div class="min-w-0 break-words text-sm text-slate-200 sm:text-right">
			<slot />
		</div>
	</div>
</template>
