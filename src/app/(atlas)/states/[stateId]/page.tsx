import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { getAtlasData } from "@/lib/content";
import { site } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/states/[stateId]">): Promise<Metadata> {
  const { stateId } = await params;
  await connection();
  const data = await getAtlasData();
  const state = data.visited.find((v) => v.stateId === stateId);
  return { title: state ? `${state.name} | ${site.name}` : site.name };
}

// The zoomed-in state map is drawn by the layout; this only checks the state exists.
export default function StatePage({ params }: PageProps<"/states/[stateId]">) {
  return (
    <Suspense>
      <CheckState params={params} />
    </Suspense>
  );
}

async function CheckState({ params }: { params: PageProps<"/states/[stateId]">["params"] }) {
  const { stateId } = await params;
  await connection();
  const data = await getAtlasData();
  if (!data.visited.some((v) => v.stateId === stateId)) notFound();
  return null;
}
