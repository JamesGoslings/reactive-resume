import type { Typography } from "@reactive-resume/schema/resume/data";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Font } from "@react-pdf/renderer";
import { getWebFontSource } from "@reactive-resume/fonts";

const typography = {
	body: {
		fontSize: 10,
		fontFamily: "IBM Plex Serif",
		lineHeight: 1.5,
		fontWeights: ["400", "500"],
	},
	heading: {
		fontSize: 14,
		fontFamily: "IBM Plex Serif",
		lineHeight: 1.5,
		fontWeights: ["600"],
	},
} satisfies Typography;

const cjkTypography = {
	body: {
		fontSize: 10,
		fontFamily: "Noto Serif SC",
		lineHeight: 1.5,
		fontWeights: ["400"],
	},
	heading: {
		fontSize: 14,
		fontFamily: "Noto Serif SC",
		lineHeight: 1.5,
		fontWeights: ["400"],
	},
} satisfies Typography;

describe("registerFonts", () => {
	beforeEach(() => {
		vi.resetModules();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("registers CJK PDF fallbacks for normal and italic text styles", async () => {
		const registerSpy = vi.spyOn(Font, "register").mockImplementation(() => {});
		const cjkFallbackSource = getWebFontSource("Noto Serif SC", "400", false);
		const { registerFonts } = await import("./use-register-fonts");

		const pdfTypography = registerFonts(typography);

		expect(pdfTypography.body.fontFamily).toEqual(["IBM Plex Serif", "Noto Serif SC"]);
		expect(pdfTypography.heading.fontFamily).toEqual(["IBM Plex Serif", "Noto Serif SC"]);

		expect(registerSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				family: "Noto Serif SC",
				fontWeight: 400,
				fontStyle: "normal",
			}),
		);
		expect(registerSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				family: "Noto Serif SC",
				fontWeight: 400,
				fontStyle: "italic",
				src: cjkFallbackSource,
			}),
		);
	});

	it("uses the full CJK font source for synthetic italic variants when the CJK font is primary", async () => {
		const registerSpy = vi.spyOn(Font, "register").mockImplementation(() => {});
		const cjkFallbackSource = getWebFontSource("Noto Serif SC", "400", false);
		const { registerFonts } = await import("./use-register-fonts");

		registerFonts(cjkTypography);

		expect(registerSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				family: "Noto Serif SC",
				fontWeight: 400,
				fontStyle: "italic",
				src: cjkFallbackSource,
			}),
		);
	});

	it("returns typography with font weights sorted ascending", async () => {
		vi.spyOn(Font, "register").mockImplementation(() => {});
		const { registerFonts } = await import("./use-register-fonts");

		const pdfTypography = registerFonts({
			...typography,
			body: { ...typography.body, fontFamily: "Source Sans 3", fontWeights: ["800", "600", "400"] },
			heading: { ...typography.heading, fontFamily: "Source Sans 3", fontWeights: ["900", "500"] },
		});

		expect(pdfTypography.body.fontWeights).toEqual(["400", "600", "800"]);
		expect(pdfTypography.heading.fontWeights).toEqual(["500", "900"]);
	});
});
