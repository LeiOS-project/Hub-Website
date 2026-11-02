<script setup lang="ts">
/** Search LeiOS users by username or display name and pick one (`v-model` is the picked user). */
export interface UserSearchResult {
	id: number;
	username: string;
	display_name: string | null;
}

const selected = defineModel<UserSearchResult | null>({ default: null });

defineProps<{
	placeholder?: string;
}>();

const query = ref("");
const results = ref<UserSearchResult[]>([]);
const loading = ref(false);
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

function onInput(value: string) {
	query.value = value;
	selected.value = null;

	if (searchTimeout) clearTimeout(searchTimeout);

	if (value.length < 2) {
		results.value = [];
		return;
	}

	searchTimeout = setTimeout(async () => {
		loading.value = true;
		const res = await useAPI((api) => api.getUsersSearch({ query: { q: value, limit: 10 } }));
		results.value = res.success ? res.data : [];
		loading.value = false;
	}, 300);
}

function select(user: UserSearchResult) {
	selected.value = user;
	query.value = user.username;
	results.value = [];
}
</script>

<template>
	<div class="relative w-full">
		<UInput
			:model-value="query"
			:placeholder="placeholder ?? 'Search by username or display name...'"
			icon="i-lucide-search"
			class="w-full"
			autocomplete="off"
			@input="onInput(($event.target as HTMLInputElement).value);"
		>
			<template v-if="loading" #trailing>
				<UIcon name="i-lucide-loader-circle" class="animate-spin" />
			</template>
		</UInput>

		<div
			v-if="results.length > 0"
			class="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 shadow-xl"
		>
			<button
				v-for="user in results"
				:key="user.id"
				type="button"
				class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-slate-800 hover:text-white"
				@click="select(user);"
			>
				<UIcon name="i-lucide-user" class="h-4 w-4 shrink-0 text-slate-500" />
				<span class="font-medium">{{ user.username }}</span>
				<span v-if="user.display_name" class="text-slate-500">({{ user.display_name }})</span>
			</button>
		</div>

		<p v-if="selected" class="mt-1.5 flex items-center gap-1 text-xs text-emerald-400">
			<UIcon name="i-lucide-check-circle" class="h-3.5 w-3.5" />
			Selected: <strong>{{ selected.username }}</strong>
			<span v-if="selected.display_name" class="text-slate-500">— {{ selected.display_name }}</span>
		</p>
	</div>
</template>
