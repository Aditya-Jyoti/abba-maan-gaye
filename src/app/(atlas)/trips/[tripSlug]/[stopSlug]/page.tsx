import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { StopArticle } from "@/components/blog/StopArticle";
import { getViewer } from "@/lib/auth/session";
import { getStopPage } from "@/lib/content";
import { stopEditHref } from "@/lib/routes";
import { site } from "@/lib/site";

type Params = PageProps<"/trips/[tripSlug]/[stopSlug]">["params"];

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { tripSlug, stopSlug } = await params;
  await connection();
  const page = await getStopPage(tripSlug, stopSlug);
  if (!page) return { title: site.name };
  return {
    title: `${page.stop.title} | ${page.stop.name} | ${site.name}`,
    description: page.stop.dek || undefined,
  };
}

export default function StopPage({ params }: { params: Params }) {
  return (
    <Suspense>
      <Stop params={params} />
    </Suspense>
  );
}

async function Stop({ params }: { params: Params }) {
  const { tripSlug, stopSlug } = await params;
  await connection();
  const [page, viewer] = await Promise.all([getStopPage(tripSlug, stopSlug), getViewer()]);
  // Editors can open hidden stops, but only in the editor.
  if (!page && viewer) redirect(stopEditHref(tripSlug, stopSlug));
  if (!page) notFound();
  return <StopArticle page={page} viewer={viewer} />;
}
