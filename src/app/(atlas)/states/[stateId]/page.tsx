import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getAtlasData } from "@/lib/content";
import { site } from "@/lib/site";

// The title depends on the URL, so navigating here waits for it. The map itself
// animates on the client meanwhile, so there's nothing to gain from an instant shell.
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/states/[stateId]">): Promise<Metadata> {
  const { stateId } = await params;
  // getAtlasData is cached, so the title doesn't need a request of its own.
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
  const data = await getAtlasData();
  if (!data.visited.some((v) => v.stateId === stateId)) notFound();
  return null;
}
