import type { LayoutPage, ResumeData, Typography } from "@reactive-resume/schema/resume/data";
import type { Template } from "@reactive-resume/schema/templates";
import type { ComponentType } from "react";
import type { SectionTitleResolver } from "./section-title";
import { Document } from "@react-pdf/renderer";
import { useMemo } from "react";
import { RenderProvider } from "./context";
import { registerFonts } from "./hooks/use-register-fonts";
import { getTemplatePage } from "./templates";

export type TemplatePageProps = {
	page: LayoutPage;
	pageIndex: number;
};

export type TemplatePage = ComponentType<TemplatePageProps>;

export type ResumeDocumentProps = {
	data: ResumeData;
	template: Template;
	resolveSectionTitle?: SectionTitleResolver | undefined;
};

export const ResumeDocument = ({ data, template, resolveSectionTitle }: ResumeDocumentProps) => {
	const TemplatePageComponent = getTemplatePage(template);
	const typography = registerFonts(data.metadata.typography) as Typography;

	// `registerFonts` widens `fontFamily` to `string | string[]` for CJK
	// fallback (#2986); the cast carries that wider runtime value through
	// `ResumeData` without changing the public schema.
	const resumeData = useMemo(() => ({ ...data, metadata: { ...data.metadata, typography } }), [data, typography]);

	return (
		<RenderProvider data={resumeData} resolveSectionTitle={resolveSectionTitle}>
			<Document
				title={`${resumeData.basics.name} Resume`}
				author={resumeData.basics.name}
				subject={resumeData.basics.headline}
			>
				{resumeData.metadata.layout.pages.map((page, index) => (
					<TemplatePageComponent key={index} page={page} pageIndex={index} />
				))}
			</Document>
		</RenderProvider>
	);
};
