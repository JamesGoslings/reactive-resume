import { describe, expect, it } from "vitest";
import { fontList, getPdfCjkFallbackFontFamily, getWebFontSource } from "./index";

const sortFontFamilies = (families: string[]) => {
	return [...families].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
};

describe("fontList", () => {
	it("is ordered by font family name instead of localized display name", () => {
		const families = fontList.map((font) => font.family);

		expect(families).toEqual(sortFontFamilies(families));
	});
});

describe("font source helpers", () => {
	it("uses the full normal font source when an italic variant is unavailable", () => {
		expect(getWebFontSource("Noto Serif SC", "400", true)).toBe(getWebFontSource("Noto Serif SC", "400", false));
	});

	it("returns CJK PDF fallbacks for standard PDF fonts", () => {
		expect(getPdfCjkFallbackFontFamily("Helvetica")).toBe("Noto Sans SC");
		expect(getPdfCjkFallbackFontFamily("Times-Roman")).toBe("Noto Serif SC");
	});
});
