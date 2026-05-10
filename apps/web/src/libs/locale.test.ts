import { describe, expect, it } from "vitest";
import { isLocale, isRTL, resolveLocale } from "./locale";

describe("isLocale", () => {
	it("returns true for known locale en-US", () => {
		expect(isLocale("en-US")).toBe(true);
	});

	it("returns true for de-DE", () => {
		expect(isLocale("de-DE")).toBe(true);
	});

	it("returns true for zh-CN", () => {
		expect(isLocale("zh-CN")).toBe(true);
	});

	it("returns false for unknown locale", () => {
		expect(isLocale("xx-YY")).toBe(false);
	});

	it("returns false for empty string", () => {
		expect(isLocale("")).toBe(false);
	});

	it("returns false for malformed locale", () => {
		expect(isLocale("not a locale")).toBe(false);
	});

	it("is case-sensitive", () => {
		expect(isLocale("en-us")).toBe(false);
	});
});

describe("resolveLocale", () => {
	it("returns the locale unchanged when valid", () => {
		expect(resolveLocale("fr-FR")).toBe("fr-FR");
	});

	it("returns en-US default for invalid locale", () => {
		expect(resolveLocale("xx-YY")).toBe("en-US");
	});

	it("returns en-US default for empty string", () => {
		expect(resolveLocale("")).toBe("en-US");
	});
});

describe("isRTL", () => {
	it("returns true for Arabic", () => {
		expect(isRTL("ar-SA")).toBe(true);
	});

	it("returns true for Hebrew", () => {
		expect(isRTL("he-IL")).toBe(true);
	});

	it("returns true for Persian/Farsi", () => {
		expect(isRTL("fa-IR")).toBe(true);
	});

	it("returns true for Urdu", () => {
		expect(isRTL("ur-PK")).toBe(true);
	});

	it("returns false for English", () => {
		expect(isRTL("en-US")).toBe(false);
	});

	it("returns false for German", () => {
		expect(isRTL("de-DE")).toBe(false);
	});

	it("returns false for Chinese", () => {
		expect(isRTL("zh-CN")).toBe(false);
	});

	it("returns false for unknown locale", () => {
		expect(isRTL("xyz-XX")).toBe(false);
	});

	it("matches prefix case-insensitively (lowercase prefix)", () => {
		expect(isRTL("AR-SA")).toBe(true);
	});

	it("works with locale-only string (no region)", () => {
		expect(isRTL("ar")).toBe(true);
		expect(isRTL("en")).toBe(false);
	});
});
