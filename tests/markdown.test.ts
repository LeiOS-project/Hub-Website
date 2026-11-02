/// <reference types="bun-types/test.d.ts" />
import { describe, expect, test } from "bun:test";
import {
	decodeEntities,
	markdownToPlainText,
	parseMarkdown,
	safeHref,
} from "../app/utils/markdown.ts";

describe("safeHref", () => {
	test("keeps web, mail and relative links", () => {
		expect(safeHref("https://leios.dev")).toBe("https://leios.dev");
		expect(safeHref("HTTP://example.com/x")).toBe("HTTP://example.com/x");
		expect(safeHref("mailto:team@leios.dev")).toBe("mailto:team@leios.dev");
		expect(safeHref("/explore/leios.base")).toBe("/explore/leios.base");
		expect(safeHref("#install")).toBe("#install");
		expect(safeHref("./docs")).toBe("./docs");
	});

	test("drops script and other schemes", () => {
		expect(safeHref("javascript:alert(1)")).toBeUndefined();
		expect(safeHref(" JavaScript:alert(1)")).toBeUndefined();
		expect(safeHref("data:text/html,<script>")).toBeUndefined();
		expect(safeHref("vbscript:x")).toBeUndefined();
		expect(safeHref("//evil.example")).toBeUndefined();
		expect(safeHref("")).toBeUndefined();
		expect(safeHref(null)).toBeUndefined();
	});
});

describe("decodeEntities", () => {
	test("decodes named and numeric entities", () => {
		expect(decodeEntities("A &amp; B &lt;3 &#169; &#x1F600; &unknown;")).toBe(
			"A & B <3 © 😀 &unknown;",
		);
	});
});

describe("markdownToPlainText", () => {
	test("strips formatting and joins blocks", () => {
		expect(
			markdownToPlainText(
				"## Firefox\n\nA **fast** browser with [extensions](https://x.dev).\n\n- one\n- two\n\n```sh\napt install firefox\n```",
			),
		).toBe("Firefox A fast browser with extensions. one two apt install firefox");
	});

	test("shows raw HTML as text instead of dropping or running it", () => {
		expect(markdownToPlainText("<script>alert(1)</script>")).toBe("<script>alert(1)</script>");
	});

	test("cuts long text at a word boundary", () => {
		const text = markdownToPlainText("word ".repeat(50), 30);
		expect(text.length).toBeLessThanOrEqual(30);
		expect(text.endsWith("word…")).toBe(true);
	});

	test("handles empty input", () => {
		expect(markdownToPlainText(undefined)).toBe("");
		expect(markdownToPlainText("")).toBe("");
	});
});

describe("parseMarkdown", () => {
	test("keeps raw HTML as an html token (rendered as text by <MarkdownContent>)", () => {
		const [token] = parseMarkdown("<img src=x onerror=alert(1)>");
		expect(token?.type).toBe("html");
	});
});
