import type { FontWeight } from "@reactive-resume/fonts";
import type { Typography } from "@reactive-resume/schema/resume/data";
import { Font } from "@react-pdf/renderer";
import {
	getFont,
	getPdfCjkFallbackFontFamily,
	getWebFontSource,
	isStandardPdfFontFamily,
} from "@reactive-resume/fonts";

type FontWeightRange = {
	lowest: number;
	highest: number;
};

const registeredFontVariants = new Set<string>();
const fallbackFontFamily = "IBM Plex Serif";

// `fontFamily` is widened to `string | string[]` so react-pdf can do
// glyph-level font fallback for CJK characters (#2986).
export type PdfTypography = Omit<Typography, "body" | "heading"> & {
	body: Omit<Typography["body"], "fontFamily"> & { fontFamily: string | string[] };
	heading: Omit<Typography["heading"], "fontFamily"> & { fontFamily: string | string[] };
};

const getFontWeightRange = (fontWeights: string[]): FontWeightRange => {
	const numericWeights = fontWeights.map(Number).filter((weight) => Number.isFinite(weight));
	if (numericWeights.length === 0) return { lowest: 400, highest: 700 };

	const lowest = Math.min(...numericWeights);
	const rawHighest = Math.max(...numericWeights);
	const highest = rawHighest <= lowest ? 700 : rawHighest;

	return { lowest, highest };
};

const toFontWeight = (weight: number): FontWeight => {
	if (weight <= 100) return "100";
	if (weight <= 200) return "200";
	if (weight <= 300) return "300";
	if (weight <= 400) return "400";
	if (weight <= 500) return "500";
	if (weight <= 600) return "600";
	if (weight <= 700) return "700";
	if (weight <= 800) return "800";
	return "900";
};

const resolvePdfFontFamily = (family: string) => {
	return getFont(family) ? family : fallbackFontFamily;
};

const resolvePdfTypography = (typography: Typography): Typography => {
	const bodyFontFamily = resolvePdfFontFamily(typography.body.fontFamily);
	const headingFontFamily = resolvePdfFontFamily(typography.heading.fontFamily);

	if (bodyFontFamily === typography.body.fontFamily && headingFontFamily === typography.heading.fontFamily) {
		return typography;
	}

	return {
		...typography,
		body: { ...typography.body, fontFamily: bodyFontFamily },
		heading: { ...typography.heading, fontFamily: headingFontFamily },
	};
};

export const registerFonts = (typography: Typography): PdfTypography => {
	const pdfTypography = resolvePdfTypography(typography);
	const bodyFontFamily = pdfTypography.body.fontFamily;
	const headingFontFamily = pdfTypography.heading.fontFamily;
	const bodyRange = getFontWeightRange(pdfTypography.body.fontWeights);
	const headingRange = getFontWeightRange(pdfTypography.heading.fontWeights);

	const registerFont = (family: string, weight: number, italic = false) => {
		if (isStandardPdfFontFamily(family)) return;

		const normalizedWeight = toFontWeight(weight);
		const fontStyle = italic ? "italic" : "normal";
		const key = `${family}:${normalizedWeight}:${fontStyle}`;
		if (registeredFontVariants.has(key)) return;

		const source = getWebFontSource(family, normalizedWeight, italic);
		if (!source) return;

		Font.register({ family, src: source, fontWeight: Number(normalizedWeight), fontStyle });
		registeredFontVariants.add(key);
	};

	for (const italic of [false, true]) {
		registerFont(bodyFontFamily, bodyRange.lowest, italic);
		registerFont(bodyFontFamily, bodyRange.highest, italic);
		registerFont(headingFontFamily, headingRange.lowest, italic);
		registerFont(headingFontFamily, headingRange.highest, italic);
	}

	// Register a CJK fallback so textkit can substitute per-codepoint for
	// characters the primary font lacks (#2986). One weight per style is
	// enough — substitution is per-codepoint, not per-weight.
	const bodyCjkFallback = getPdfCjkFallbackFontFamily(bodyFontFamily);
	const headingCjkFallback = getPdfCjkFallbackFontFamily(headingFontFamily);

	if (bodyCjkFallback) {
		registerFont(bodyCjkFallback, 400, false);
		registerFont(bodyCjkFallback, 400, true);
	}

	if (headingCjkFallback && headingCjkFallback !== bodyCjkFallback) {
		registerFont(headingCjkFallback, 400, false);
		registerFont(headingCjkFallback, 400, true);
	}

	// Latin-only path: no fallback registered, return as-is.
	if (!bodyCjkFallback && !headingCjkFallback) {
		return pdfTypography as PdfTypography;
	}

	const bodyStack: string | string[] = bodyCjkFallback ? [bodyFontFamily, bodyCjkFallback] : bodyFontFamily;
	const headingStack: string | string[] = headingCjkFallback
		? [headingFontFamily, headingCjkFallback]
		: headingFontFamily;

	return {
		...pdfTypography,
		body: { ...pdfTypography.body, fontFamily: bodyStack },
		heading: { ...pdfTypography.heading, fontFamily: headingStack },
	};
};
