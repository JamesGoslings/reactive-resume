import type { Style } from "@react-pdf/types";
import type { CustomField } from "@reactive-resume/schema/resume/data";
import type { IconName } from "phosphor-icons-react-pdf/dynamic";
import { View } from "@react-pdf/renderer";
import { getCustomFieldLinkUrl, getWebsiteDisplayText } from "./contact";
import { Icon, Link, Text } from "./primitives";

type WebsiteDisplay = {
	url: string;
	label?: string | undefined;
};

type ContactStyle = Style | Style[];

export const WebsiteContactItem = ({
	website,
	style,
	textStyle,
	iconColor,
}: {
	website: WebsiteDisplay;
	style?: ContactStyle;
	textStyle?: ContactStyle;
	iconColor?: string;
}) => {
	if (!website.url) return null;

	return (
		<Link src={website.url} {...(style ? { style } : {})}>
			<Icon name="globe" {...(iconColor ? { color: iconColor } : {})} />
			<Text {...(textStyle ? { style: textStyle } : {})}>{getWebsiteDisplayText(website)}</Text>
		</Link>
	);
};

export const CustomFieldContactItem = ({
	field,
	style,
	textStyle,
	iconColor,
}: {
	field: CustomField;
	style?: ContactStyle;
	textStyle?: ContactStyle;
	iconColor?: string;
}) => {
	const linkUrl = getCustomFieldLinkUrl(field);
	const children = (
		<>
			<Icon name={field.icon as IconName} {...(iconColor ? { color: iconColor } : {})} />
			<Text {...(textStyle ? { style: textStyle } : {})}>{field.text}</Text>
		</>
	);

	if (linkUrl) {
		return (
			<Link src={linkUrl} {...(style ? { style } : {})}>
				{children}
			</Link>
		);
	}

	return <View {...(style ? { style } : {})}>{children}</View>;
};
