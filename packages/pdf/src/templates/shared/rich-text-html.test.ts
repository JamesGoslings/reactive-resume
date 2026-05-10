import { describe, expect, it } from "vitest";
import { normalizeRichTextHtml } from "./rich-text-html";

describe("normalizeRichTextHtml", () => {
	it("wraps loose inline content in a <p>", () => {
		expect(normalizeRichTextHtml("hello world")).toBe("<p>hello world</p>");
	});

	it("wraps inline tags in a <p>", () => {
		expect(normalizeRichTextHtml("<strong>bold</strong> text")).toBe("<p><strong>bold</strong> text</p>");
	});

	it("preserves block-level <p> as-is", () => {
		expect(normalizeRichTextHtml("<p>Already wrapped</p>")).toBe("<p>Already wrapped</p>");
	});

	it("preserves block-level <ul>", () => {
		const html = "<ul><li>a</li><li>b</li></ul>";
		expect(normalizeRichTextHtml(html)).toBe(html);
	});

	it("flushes accumulated inlines before block-level tags", () => {
		expect(normalizeRichTextHtml("loose<ul><li>a</li></ul>")).toBe("<p>loose</p><ul><li>a</li></ul>");
	});

	it("flushes accumulated inlines after block-level tags", () => {
		expect(normalizeRichTextHtml("<ul><li>a</li></ul>after")).toBe("<ul><li>a</li></ul><p>after</p>");
	});

	it("treats <span> as inline", () => {
		expect(normalizeRichTextHtml("<span>x</span>")).toBe("<p><span>x</span></p>");
	});

	it("trims input whitespace", () => {
		expect(normalizeRichTextHtml("   text   ")).toBe("<p>text</p>");
	});

	it("returns empty string for empty input", () => {
		expect(normalizeRichTextHtml("")).toBe("");
	});

	it("treats <a> as inline (no need to wrap by itself)", () => {
		expect(normalizeRichTextHtml('<a href="x">link</a>')).toBe('<p><a href="x">link</a></p>');
	});

	it("does not double-wrap inline tags inside block elements", () => {
		expect(normalizeRichTextHtml("<p><strong>x</strong></p>")).toBe("<p><strong>x</strong></p>");
	});
});
