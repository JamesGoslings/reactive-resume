import { describe, expect, it } from "vitest";
import { defaultLocale, isLocale } from "./locale";

describe("defaultLocale", () => {
	it("is en-US", () => {
		expect(defaultLocale).toBe("en-US");
	});
});

describe("isLocale", () => {
	it("returns true for non-empty string", () => {
		expect(isLocale("en-US")).toBe(true);
	});

	it("returns true for any non-empty string (no validation of locale shape)", () => {
		expect(isLocale("xyz")).toBe(true);
	});

	it("returns false for empty string", () => {
		expect(isLocale("")).toBe(false);
	});

	it("returns false for number", () => {
		expect(isLocale(42)).toBe(false);
	});

	it("returns false for null", () => {
		expect(isLocale(null)).toBe(false);
	});

	it("returns false for undefined", () => {
		expect(isLocale(undefined)).toBe(false);
	});

	it("returns false for object", () => {
		expect(isLocale({})).toBe(false);
	});

	it("returns false for array", () => {
		expect(isLocale([])).toBe(false);
	});
});
