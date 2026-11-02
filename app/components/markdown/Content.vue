<script lang="ts">
/**
 * Renders user-written Markdown (descriptions, changelogs, messages) as Vue nodes. Raw HTML shows
 * as text and unsafe links lose their target (see `utils/markdown.ts`), so it is safe for content
 * anyone can write, and it renders during SSR.
 */
import type { Token, Tokens } from "marked";
import { computed, defineComponent, Fragment, h, type VNodeChild } from "vue";
import { decodeEntities, parseMarkdown, safeHref } from "~/utils/markdown";

const HEADING_CLASSES: Record<number, string> = {
	1: "text-xl font-bold",
	2: "text-lg font-semibold",
};

function fragment(children: VNodeChild[]) {
	return h(Fragment, null, children);
}

function renderInlines(tokens: Token[] | undefined): VNodeChild[] {
	return (tokens ?? []).map(renderInline);
}

function renderInline(token: Token): VNodeChild {
	switch (token.type) {
		case "text":
			return "tokens" in token && token.tokens
				? fragment(renderInlines(token.tokens))
				: decodeEntities(token.text);
		case "escape":
			return token.text;
		case "strong":
			return h("strong", { class: "font-semibold text-highlighted" }, renderInlines(token.tokens));
		case "em":
			return h("em", renderInlines(token.tokens));
		case "del":
			return h("del", renderInlines(token.tokens));
		case "codespan":
			return h(
				"code",
				{ class: "rounded bg-elevated px-1 py-0.5 font-mono text-[0.875em]" },
				decodeEntities(token.text),
			);
		case "br":
			return h("br");
		case "link":
		case "image": {
			const href = safeHref(token.href);
			const children =
				token.type === "image" ? [token.text || token.href] : renderInlines(token.tokens);
			if (!href) return fragment(children);
			// Images become links: content from anyone should not load remote resources.
			return h(
				"a",
				{
					href,
					target: href.startsWith("#") ? undefined : "_blank",
					rel: "nofollow ugc noopener noreferrer",
					class: "text-primary underline-offset-2 hover:underline",
				},
				children,
			);
		}
		case "checkbox":
			return h("input", {
				type: "checkbox",
				checked: token.checked,
				disabled: true,
				class: "me-1.5 align-middle accent-(--ui-primary)",
			});
		case "html":
			return token.text;
		default:
			return "raw" in token ? token.raw : "";
	}
}

function renderTable(token: Tokens.Table) {
	const align = (value: Tokens.TableCell["align"]) =>
		value === "center" ? "text-center" : value === "right" ? "text-right" : "text-left";
	return h("div", { class: "my-3 overflow-x-auto" }, [
		h("table", { class: "min-w-full border border-default text-sm" }, [
			h(
				"thead",
				{ class: "bg-elevated" },
				h(
					"tr",
					token.header.map((cell) =>
						h(
							"th",
							{ class: `border border-default px-3 py-1.5 font-semibold ${align(cell.align)}` },
							renderInlines(cell.tokens),
						),
					),
				),
			),
			h(
				"tbody",
				token.rows.map((row) =>
					h(
						"tr",
						row.map((cell) =>
							h(
								"td",
								{ class: `border border-default px-3 py-1.5 ${align(cell.align)}` },
								renderInlines(cell.tokens),
							),
						),
					),
				),
			),
		]),
	]);
}

function renderBlocks(tokens: Token[] | undefined): VNodeChild[] {
	return (tokens ?? []).map(renderBlock);
}

function renderBlock(token: Token): VNodeChild {
	switch (token.type) {
		case "space":
		case "def":
			return null;
		case "heading":
			// User content sits below the page's own headings.
			return h(
				`h${Math.min(token.depth + 1, 6)}`,
				{
					class: `mt-5 mb-2 text-highlighted first:mt-0 ${HEADING_CLASSES[token.depth] ?? "text-base font-semibold"}`,
				},
				renderInlines(token.tokens),
			);
		case "paragraph":
			return h(
				"p",
				{ class: "my-2 leading-relaxed first:mt-0 last:mb-0" },
				renderInlines(token.tokens),
			);
		case "list":
			return h(
				token.ordered ? "ol" : "ul",
				{
					start: token.ordered && typeof token.start === "number" ? token.start : undefined,
					class: `my-2 space-y-1 ps-6 first:mt-0 last:mb-0 ${token.ordered ? "list-decimal" : "list-disc"}`,
				},
				(token as Tokens.List).items.map((item) =>
					h("li", { class: item.task ? "-ms-5 list-none" : "ps-1" }, renderBlocks(item.tokens)),
				),
			);
		case "code":
			return h(
				"pre",
				{
					class:
						"my-3 overflow-x-auto rounded-md border border-default bg-elevated p-3 text-sm first:mt-0 last:mb-0",
				},
				h("code", { class: "font-mono" }, token.text),
			);
		case "blockquote":
			return h(
				"blockquote",
				{ class: "my-3 border-s-4 border-accented ps-4 text-muted first:mt-0 last:mb-0" },
				renderBlocks(token.tokens),
			);
		case "hr":
			return h("hr", { class: "my-4 border-default" });
		case "html":
			return h("p", { class: "my-2 whitespace-pre-wrap first:mt-0 last:mb-0" }, token.text.trim());
		case "table":
			return renderTable(token as Tokens.Table);
		default:
			// block-level `text` in tight lists, task checkboxes
			return renderInline(token);
	}
}

export default defineComponent({
	name: "MarkdownContent",
	props: {
		/** The Markdown source. */
		value: { type: String, default: "" },
		/** Smaller text, for comments and lists. */
		compact: { type: Boolean, default: false },
	},
	setup(props) {
		const tokens = computed(() => parseMarkdown(props.value ?? ""));
		return () =>
			h(
				"div",
				{ class: ["min-w-0 break-words", props.compact ? "text-sm" : "text-base"] },
				renderBlocks(tokens.value),
			);
	},
});
</script>
