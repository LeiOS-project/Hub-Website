<script setup lang="ts">
/**
 * Page-size picker + "1–25 of 132" for server-paginated tables. Goes in `DashboardDataTable`'s
 * `#footer-left` slot, next to a `UPagination` bound to the same page in `#footer-right`.
 */
const props = withDefaults(
	defineProps<{
		/** Total number of matching items (the list endpoint's `total`). */
		total: number;
		/** Current page, 1-based. */
		page: number;
		options?: number[];
	}>(),
	{
		options: () => [10, 25, 50, 100],
	},
);

const pageSize = defineModel<number>("pageSize", { required: true });

const items = computed(() => props.options.map((size) => ({ label: String(size), value: size })));

const range = computed(() => {
	if (props.total === 0) return "No results";
	const from = (props.page - 1) * pageSize.value + 1;
	const to = Math.min(props.page * pageSize.value, props.total);
	return `${from}–${to} of ${props.total}`;
});
</script>

<template>
	<div class="flex items-center gap-3">
		<USelect v-model="pageSize" :items="items" size="md" class="min-w-18" />
		<span class="text-sm text-muted">{{ range }}</span>
	</div>
</template>
