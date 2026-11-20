import { asc, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { stopRevisions, stops, trips, users, type StopContent } from "@/db/schema";
import { buildStopPage, liveContent, stopPin, type StopPage } from "@/lib/content";
import { stateName, type Point } from "@/lib/map";
import { stopEditHref } from "@/lib/routes";

// Reads for the editor. Unlike src/lib/content.ts these include unpublished trips,
// stops and drafts, so they are never cached and must only run for signed-in editors.

export type StopSettings = {
  name: string;
  slug: string;
  startDate: string | null;
  endDate: string | null;
  nights: number | null;
  pin: Point | null;
  homeSlot: number | null;
};

export type TripSettings = {
  title: string;
  slug: string;
  stateId: string;
  startDate: string | null;
  endDate: string | null;
  colorIndex: number;
  homeSlot: number | null;
};

export type EditorTripStop = {
  id: string;
  slug: string;
  name: string;
  published: boolean;
  hasDraft: boolean;
  pin: Point | null;
  href: string;
};

export type EditorStop = {
  stopId: string;
  tripId: string;
  /** The page as the editor sees it: the draft if there is one, otherwise the live copy. */
  page: StopPage;
  content: StopContent;
  version: number;
  hasDraft: boolean;
  published: boolean;
  tripPublished: boolean;
  draftSavedAt: string | null;
  draftSavedBy: string | null;
  settings: StopSettings;
  trip: TripSettings;
  tripStops: EditorTripStop[];
};

export async function getEditorStop(tripSlug: string, stopSlug: string): Promise<EditorStop | null> {
  const db = getDb();
  const [trip] = await db.select().from(trips).where(eq(trips.slug, tripSlug));
  if (!trip) return null;
  const tripStops = await db.select().from(stops).where(eq(stops.tripId, trip.id)).orderBy(asc(stops.position));
  const index = tripStops.findIndex((s) => s.slug === stopSlug);
  if (index < 0) return null;
  const s = tripStops[index];
  const content = s.draft ?? liveContent(s);

  let draftSavedBy: string | null = null;
  if (s.draft && s.draftUpdatedBy) {
    const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, s.draftUpdatedBy));
    draftSavedBy = u?.name ?? null;
  }

  return {
    stopId: s.id,
    tripId: trip.id,
    page: buildStopPage(trip, tripStops, index, content, stopEditHref),
    content,
    version: s.draftVersion,
    hasDraft: s.draft != null,
    published: s.published,
    tripPublished: trip.published,
    draftSavedAt: s.draft ? (s.draftUpdatedAt?.toISOString() ?? null) : null,
    draftSavedBy,
    settings: {
      name: s.name,
      slug: s.slug,
      startDate: s.startDate,
      endDate: s.endDate,
      nights: s.nights,
      pin: stopPin(s),
      homeSlot: s.homeSlot,
    },
    trip: {
      title: trip.title,
      slug: trip.slug,
      stateId: trip.stateId,
      startDate: trip.startDate,
      endDate: trip.endDate,
      colorIndex: trip.colorIndex,
      homeSlot: trip.homeSlot,
    },
    tripStops: tripStops.map((x) => ({
      id: x.id,
      slug: x.slug,
      name: x.name,
      published: x.published,
      hasDraft: x.draft != null,
      pin: stopPin(x),
      href: stopEditHref(trip.slug, x.slug),
    })),
  };
}

export type EditorIndexTrip = {
  id: string;
  slug: string;
  title: string;
  stateName: string;
  published: boolean;
  startDate: string | null;
  stops: { slug: string; name: string; published: boolean; hasDraft: boolean; href: string }[];
};

/** Every trip and stop, including hidden ones, for the editor's trip list. */
export async function getEditorIndex(): Promise<EditorIndexTrip[]> {
  const db = getDb();
  const allTrips = await db.select().from(trips).orderBy(desc(trips.startDate), desc(trips.createdAt));
  const allStops = await db
    .select({
      tripId: stops.tripId,
      slug: stops.slug,
      name: stops.name,
      published: stops.published,
      hasDraft: sql<boolean>`${stops.draft} is not null`,
    })
    .from(stops)
    .orderBy(asc(stops.position));
  return allTrips.map((t) => ({
    id: t.id,
    slug: t.slug,
    title: t.title,
    stateName: stateName(t.stateId),
    published: t.published,
    startDate: t.startDate,
    stops: allStops
      .filter((s) => s.tripId === t.id)
      .map((s) => ({
        slug: s.slug,
        name: s.name,
        published: s.published,
        hasDraft: s.hasDraft,
        href: stopEditHref(t.slug, s.slug),
      })),
  }));
}

export type RevisionSummary = { id: string; publishedAt: string; publishedBy: string | null };

export async function getRevisions(stopId: string): Promise<RevisionSummary[]> {
  const rows = await getDb()
    .select({ id: stopRevisions.id, publishedAt: stopRevisions.publishedAt, publishedBy: users.name })
    .from(stopRevisions)
    .leftJoin(users, eq(users.id, stopRevisions.publishedBy))
    .where(eq(stopRevisions.stopId, stopId))
    .orderBy(desc(stopRevisions.publishedAt))
    .limit(100);
  return rows.map((r) => ({ id: r.id, publishedAt: r.publishedAt.toISOString(), publishedBy: r.publishedBy }));
}
