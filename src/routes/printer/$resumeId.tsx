import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { zodValidator } from "@tanstack/zod-adapter";
import { useEffect } from "react";
import { z } from "zod";

import { LoadingScreen } from "@/components/layout/loading-screen";
import { ResumePreview } from "@/components/resume/preview";
import { useResumeStore } from "@/components/resume/store/resume";
import { resumeService } from "@/integrations/orpc/services/resume";
import { env } from "@/utils/env";
import { verifyPrinterToken } from "@/utils/printer-token";

const searchSchema = z.object({
  token: z.string().catch(""),
});

const getResumeForPrinterFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string(), token: z.string() }))
  .handler(({ data }) => {
    return resumeService.getByIdForPrinter({ id: data.id, printerToken: data.token });
  });

function assertValidPrinterToken(token: string, resumeId: string): void {
  const tokenResumeId = verifyPrinterToken(token);
  if (tokenResumeId === resumeId) return;
  throw new Error("Printer token does not match resume ID");
}

export const Route = createFileRoute("/printer/$resumeId")({
  component: RouteComponent,
  validateSearch: zodValidator(searchSchema),
  beforeLoad: async ({ params, search }) => {
    if (env.FLAG_DEBUG_PRINTER) return;

    try {
      assertValidPrinterToken(search.token, params.resumeId);
    } catch {
      throw redirect({ to: "/", search: {}, throw: true });
    }
  },
  loaderDeps: ({ search }) => ({ token: search.token }),
  loader: async ({ params, deps }) => {
    const resume = await getResumeForPrinterFn({ data: { id: params.resumeId, token: deps.token } });

    return { resume };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `${loaderData.resume.data.basics.name} - Resume` : "Resume" }],
  }),
});

function RouteComponent() {
  const { resume } = Route.useLoaderData();

  const isReady = useResumeStore((state) => state.isReady);
  const initialize = useResumeStore((state) => state.initialize);

  useEffect(() => {
    if (!resume) return;
    initialize(resume);
    return () => initialize(null);
  }, [resume, initialize]);

  if (!isReady) return <LoadingScreen />;

  return <ResumePreview pageClassName="print:w-full!" />;
}
