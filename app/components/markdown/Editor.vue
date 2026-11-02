<script setup lang="ts">
/**
 * Rich-text editor that reads and writes Markdown (Nuxt UI's `UEditor`), for descriptions,
 * changelogs and messages. `<MarkdownContent>` renders what it produces.
 */
import type { EditorToolbarItem } from "@nuxt/ui";

const model = defineModel<string>({ default: "" });

const props = withDefaults(
	defineProps<{
		placeholder?: string;
		disabled?: boolean;
		/** Minimum height of the writing area, as a Tailwind class. */
		minHeightClass?: string;
	}>(),
	{
		placeholder: "Write here… Markdown works too.",
		disabled: false,
		minHeightClass: "min-h-32",
	},
);

const toolbarItems: EditorToolbarItem[][] = [
	[
		{ kind: "heading", level: 2, icon: "i-lucide-heading-2", tooltip: { text: "Heading" } },
		{ kind: "heading", level: 3, icon: "i-lucide-heading-3", tooltip: { text: "Subheading" } },
	],
	[
		{ kind: "mark", mark: "bold", icon: "i-lucide-bold", tooltip: { text: "Bold" } },
		{ kind: "mark", mark: "italic", icon: "i-lucide-italic", tooltip: { text: "Italic" } },
		{
			kind: "mark",
			mark: "strike",
			icon: "i-lucide-strikethrough",
			tooltip: { text: "Strikethrough" },
		},
		{ kind: "mark", mark: "code", icon: "i-lucide-code", tooltip: { text: "Inline code" } },
		{ kind: "link", icon: "i-lucide-link", tooltip: { text: "Link (select text first)" } },
	],
	[
		{ kind: "bulletList", icon: "i-lucide-list", tooltip: { text: "Bulleted list" } },
		{ kind: "orderedList", icon: "i-lucide-list-ordered", tooltip: { text: "Numbered list" } },
		{ kind: "blockquote", icon: "i-lucide-text-quote", tooltip: { text: "Quote" } },
		{ kind: "codeBlock", icon: "i-lucide-square-code", tooltip: { text: "Code block" } },
	],
	[
		{ kind: "undo", icon: "i-lucide-undo-2", tooltip: { text: "Undo" } },
		{ kind: "redo", icon: "i-lucide-redo-2", tooltip: { text: "Redo" } },
	],
];
</script>

<template>
    <div
        class="w-full overflow-hidden rounded-md border border-default bg-default transition-colors focus-within:border-primary"
        :class="{ 'opacity-75': props.disabled }"
    >
        <UEditor
            v-slot="{ editor }"
            v-model="model"
            content-type="markdown"
            :image="false"
            :mention="false"
            :placeholder="props.placeholder"
            :editable="!props.disabled"
            class="w-full"
            :ui="{
                base: `${props.minHeightClass} px-3 py-2 sm:px-3 text-sm *:my-2 [&_h2]:text-lg [&_h3]:text-base [&_p]:leading-6`,
            }"
        >
            <UEditorToolbar
                :editor="editor"
                :items="toolbarItems"
                class="overflow-x-auto border-b border-default bg-elevated/40 px-1 py-1"
            />
        </UEditor>
    </div>
</template>
