<script setup lang="ts">
/** A one-line shell command with a copy button (e.g. the install command on package pages). */
const props = defineProps<{
	command: string;
}>();

const toast = useToast();
const copied = ref(false);
let resetTimer: ReturnType<typeof setTimeout> | undefined;

async function copy() {
	try {
		await navigator.clipboard.writeText(props.command);
	} catch {
		toast.add({
			title: "Could not copy",
			description: "Select the command and copy it manually.",
			icon: "i-lucide-alert-circle",
			color: "error",
		});
		return;
	}

	copied.value = true;
	clearTimeout(resetTimer);
	resetTimer = setTimeout(() => {
		copied.value = false;
	}, 2000);
}

onBeforeUnmount(() => clearTimeout(resetTimer));
</script>

<template>
	<div
		class="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/80 py-1.5 pr-1.5 pl-4"
	>
		<span class="shrink-0 font-mono text-sm text-slate-500 select-none">$</span>
		<code
			class="min-w-0 flex-1 overflow-x-auto py-1 font-mono text-sm whitespace-nowrap text-slate-100"
			>{{ command }}</code
		>
		<UButton
			:icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
			:color="copied ? 'success' : 'neutral'"
			variant="ghost"
			size="sm"
			:aria-label="copied ? 'Copied' : 'Copy command'"
			@click="copy();"
		/>
	</div>
</template>
