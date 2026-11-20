import { connection } from "next/server";
import { Suspense } from "react";
import { Atlas } from "@/components/atlas/Atlas";
import { Loader } from "@/components/map/Loader";
import { Sea } from "@/components/map/Sea";
import { TripsMenu } from "@/components/editor/TripsMenu";
import { getViewer } from "@/lib/auth/session";
import { getEditorIndex } from "@/lib/cms/queries";
import { getAtlasData } from "@/lib/content";

// The map stays mounted across the India, state and post pages so it can
// animate between them; each page only supplies what's specific to it.
export default function AtlasLayout({ children }: LayoutProps<"/">) {
  return (
    <main>
      <Suspense fallback={<Loader />}>
        <AtlasWithData>{children}</AtlasWithData>
      </Suspense>
      <Suspense fallback={null}>
        <EditorTrips />
      </Suspense>
    </main>
  );
}

async function AtlasWithData({ children }: { children: React.ReactNode }) {
  // Content comes from the database, so render per request (cached) rather than at build time.
  await connection();
  const data = await getAtlasData();
  return (
    <Atlas data={data} sea={<Sea />}>
      {children}
    </Atlas>
  );
}

async function EditorTrips() {
  const viewer = await getViewer();
  if (!viewer) return null;
  return <TripsMenu trips={await getEditorIndex()} viewer={viewer} />;
}
