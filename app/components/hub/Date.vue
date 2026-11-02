<script setup lang="ts">
/**
 * A calendar date ("Oct 31, 2026") in a `<time>` element. Formatted in UTC so the server-rendered
 * text matches the client during hydration.
 */
const props = defineProps<{
	value: number | null | undefined;
	/** Shown when there is no date. */
	fallback?: string;
}>();

const formatter = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	year: "numeric",
	timeZone: "UTC",
});

const isoValue = computed(() => (props.value ? new Date(props.value).toISOString() : undefined));
const label = computed(() => (props.value ? formatter.format(props.value) : null));
</script>

<template>
	<time v-if="label" :datetime="isoValue">{{ label }}</time>
	<span v-else>{{ fallback ?? "–" }}</span>
</template>
