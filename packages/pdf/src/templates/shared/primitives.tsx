import type { Style } from "@react-pdf/types";
import type { ComponentProps } from "react";
import type { StyleInput } from "./styles";
import { Icon as PhosphorIcon } from "phosphor-icons-react-pdf/dynamic";
import { useRender } from "../../context";
import { Link as PdfLink, Text as PdfText, View } from "../../renderer";
import { useTemplateIconSlot, useTemplateStyle } from "./context";
import { composeLinkStyles, composeStyles } from "./styles";

const asStyleInput = (style: unknown): StyleInput => style as StyleInput;

export const safeTextStyle = {
	minWidth: 0,
	maxWidth: "100%",
	flexShrink: 1,
	overflow: "hidden",
} satisfies Style;

export const Div = ({ style, ...props }: ComponentProps<typeof View>) => {
	const divStyle = useTemplateStyle("div");

	return <View style={composeStyles(divStyle, style as Style | Style[] | undefined)} {...props} />;
};

export const Text = ({ style, ...props }: ComponentProps<typeof PdfText>) => {
	const textStyle = useTemplateStyle("text");

	return <PdfText style={composeStyles(textStyle, asStyleInput(style), safeTextStyle)} {...props} />;
};

export const Heading = ({ style, ...props }: ComponentProps<typeof PdfText>) => {
	const headingStyle = useTemplateStyle("heading");

	return <PdfText style={composeStyles(headingStyle, asStyleInput(style), safeTextStyle)} {...props} />;
};

export const Link = ({ style, ...props }: ComponentProps<typeof PdfLink>) => {
	const linkStyle = useTemplateStyle("link");

	return <PdfLink style={composeLinkStyles(linkStyle, asStyleInput(style), safeTextStyle)} {...props} />;
};

export const Small = ({ style, ...props }: ComponentProps<typeof PdfText>) => {
	const textStyle = useTemplateStyle("text");
	const smallStyle = useTemplateStyle("small");

	return <PdfText style={composeStyles(textStyle, smallStyle, asStyleInput(style), safeTextStyle)} {...props} />;
};

export const Bold = ({ style, ...props }: ComponentProps<typeof PdfText>) => {
	const textStyle = useTemplateStyle("text");
	const boldStyle = useTemplateStyle("bold");

	return <PdfText style={composeStyles(textStyle, boldStyle, asStyleInput(style), safeTextStyle)} {...props} />;
};

export const Icon = ({ style, ...props }: ComponentProps<typeof PhosphorIcon>) => {
	const { style: iconStyle, ...iconProps } = useTemplateIconSlot("icon");

	if (iconProps.display === "none") return null;

	return <PhosphorIcon {...iconProps} {...props} style={composeStyles(asStyleInput(iconStyle), asStyleInput(style))} />;
};

export const SectionHeadingIcon = ({ style, ...props }: ComponentProps<typeof PhosphorIcon>) => {
	const data = useRender();
	const { style: sectionIconStyle, ...sectionIconProps } = useTemplateIconSlot("sectionHeadingIcon");
	const { style: fallbackIconStyle, ...fallbackIconProps } = useTemplateIconSlot("icon");

	// Fall back to the item icon slot if no section heading icon slot is defined
	const hasSlot = sectionIconStyle !== undefined || Object.keys(sectionIconProps).length > 0;
	const iconStyle = hasSlot ? sectionIconStyle : fallbackIconStyle;
	const iconProps = hasSlot ? sectionIconProps : fallbackIconProps;

	// Section heading icon visibility is controlled by hideSectionIcons (in SectionShell),
	// NOT by the item-level hideIcons toggle. Ignore the "display: none" from item icon slot.
	const { display: _, ...iconPropsWithoutDisplay } = iconProps;

	// Icon size follows heading fontSize so they scale together
	const headingFontSize = data.metadata.typography.heading.fontSize;
	const sizeStyle = { size: headingFontSize } as Style;

	return (
		<PhosphorIcon
			{...iconPropsWithoutDisplay}
			{...props}
			style={composeStyles(asStyleInput(iconStyle), sizeStyle, asStyleInput(style))}
		/>
	);
};
