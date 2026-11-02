/**
 * Markdown helpers for user-written text (descriptions, changelogs, stable request messages).
 *
 * `<MarkdownContent>` renders the tokens of `parseMarkdown` as Vue nodes: text is never inserted as
 * HTML, raw HTML in the source shows as text, and only http(s), mailto and relative links are kept.
 * That makes it safe for content anyone can write, and it renders during SSR.
 */
import { Lexer, type Token } from "marked";

export function parseMarkdown(source: string): Token[] {
	return Lexer.lex(source, { gfm: true });
}

const NAMED_ENTITIES: Record<string, string> = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: '"',
	apos: "'",
	nbsp: " ",
};

/** Decodes the HTML entities Markdown allows in text (`&amp;`, `&#169;`, `&#x1F600;`). */
export function decodeEntities(text: string): string {
	if (!text.includes("&")) return text;
	return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
		if (entity[0] === "#") {
			const code =
				entity[1] === "x" || entity[1] === "X"
					? Number.parseInt(entity.slice(2), 16)
					: Number.parseInt(entity.slice(1), 10);
			return Number.isFinite(code) && code > 0 && code <= 0x10ffff
				? String.fromCodePoint(code)
				: match;
		}
		return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
	});
}

/** The link target if it is safe to follow (http, https, mailto, or relative), else `undefined`. */
export function safeHref(href: string | null | undefined): string | undefined {
	const value = href?.trim();
	if (!value) return undefined;
	if (/^(https?:|mailto:)/i.test(value)) return value;
	// relative links and anchors, but not protocol-relative URLs (`//host`)
	if (/^(\/(?!\/)|#|\.{1,2}\/)/.test(value)) return value;
	return undefined;
}

function tokensToText(tokens: Token[] | undefined): string {
	if (!tokens) return "";
	const parts: string[] = [];
	for (const token of tokens) {
		switch (token.type) {
			case "space":
			case "hr":
			case "def":
			case "checkbox":
				break;
			case "br":
				parts.push(" ");
				break;
			case "list":
				for (const item of token.items) parts.push(tokensToText(item.tokens), " ");
				break;
			case "table":
				for (const cell of token.header) parts.push(tokensToText(cell.tokens), " ");
				for (const row of token.rows) {
					for (const cell of row) parts.push(tokensToText(cell.tokens), " ");
				}
				break;
			case "code":
			case "codespan":
			case "escape":
			case "html":
				parts.push(decodeEntities(token.text));
				break;
			case "image":
				parts.push(token.text);
				break;
			default:
				if ("tokens" in token && Array.isArray(token.tokens)) {
					parts.push(tokensToText(token.tokens));
				} else if ("text" in token && typeof token.text === "string") {
					parts.push(decodeEntities(token.text));
				}
		}
		if (
			["heading", "paragraph", "code", "blockquote", "list", "table", "html"].includes(token.type)
		) {
			parts.push(" ");
		}
	}
	return parts.join("");
}

/**
 * Plain text of Markdown, for cards, previews and meta descriptions. With `maxLength`, the text is
 * cut at a word boundary and ends with "…".
 */
export function markdownToPlainText(source: string | null | undefined, maxLength?: number): string {
	if (!source) return "";
	const text = tokensToText(parseMarkdown(source)).replace(/\s+/g, " ").trim();
	if (!maxLength || text.length <= maxLength) return text;

	const cut = text.slice(0, maxLength - 1);
	const lastSpace = cut.lastIndexOf(" ");
	return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
