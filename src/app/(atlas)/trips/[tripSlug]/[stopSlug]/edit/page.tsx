import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StopEditor } from "@/components/editor/StopEditor";
import { requireViewer } from "@/lib/auth/session";
import { getEditorStop } from "@/lib/cms/queries";
import { stopEditHref } from "@/lib/routes";
import { site } from "@/lib/site";

type Params = PageProps<"/trips/[tripSlug]/[stopSlug]/edit">["params"];

export const metadata: Metadata = {
  title: `Editing | ${site.name}`,
  robots: { index: false, follow: false },
};

export default function EditStopPage({ params }: { params: Params }) {
  return (
    <Suspense>
      <EditStop params={params} />
    </Suspense>
  );
}

async function EditStop({ params }: { params: Params }) {
  const { tripSlug, stopSlug } = await params;
  // Checked here as well as in the proxy: the proxy only sees that a cookie exists.
  const viewer = await requireViewer(stopEditHref(tripSlug, stopSlug));
  const data = await getEditorStop(tripSlug, stopSlug);
  if (!data) notFound();
  // A new editor for each stop, so one stop's unsaved state never carries into the next.
  return <StopEditor key={data.stopId} data={data} viewer={viewer} />;
}
