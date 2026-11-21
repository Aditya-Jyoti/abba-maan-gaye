import { and, asc, desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import districtBorders from "@/data/districts.json";
import { getDb } from "@/db";
import {
  stops,
  trips,
  type EatItem,
  type Photo,
  type SeeItem,
  type StopContent,
  type StopDetail,
  type StoryBlock,
} from "@/db/schema";
import { dateLong, dayMonth, monthYear, stampDay, stampMonth, tripRange } from "@/lib/format";
import { HOME_SLOTS, map, previewSpots, stateName, tripColor, type Point } from "@/lib/map";
import { stateHref, stopHref } from "@/lib/routes";

/** Cache tag for everything derived from trips and stops. */
export const CONTENT_TAG = "content";

export type VisitedState = { stateId: string; name: string; summary: string };
export type Stamp = { stateId: string; name: string; date: string };
/** A tiny polaroid pinned on a visited state on the India map, showing one of its trips. */
export type Preview = { stateId: string; x: number; y: number; rotate: number; photo: Photo | null };

export type HomeCard = {
  slot: number;
  stateId: string;
  href: string;
  title: string;
  subtitle: string;
  photo: Photo | null;
  color: string;
};

export type AtlasStop = {
  slug: string;
  name: string;
  placeKey: string | null;
  /** Pin position in map canvas coordinates, if the stop has one. */
  at: Point | null;
  /** "12 Jul" */
  date: string;
  /** "12-13 July 2025" */
  dateLong: string;
  title: string;
  photo: Photo | null;
  /** Whether the stop has a written post worth opening. */
  hasStory: boolean;
  href: string;
};

export type AtlasTrip = {
  slug: string;
  title: string;
  stateId: string;
  color: string;
  /** "12-21 Jul 2025" or "Jan 2024" */
  range: string;
  stops: AtlasStop[];
};

/** Everything the map views need. Trips are newest first. */
export type AtlasData = {
  totalStates: number;
  visited: VisitedState[];
  stamps: Stamp[];
  previews: Preview[];
  cards: HomeCard[];
  trips: AtlasTrip[];
  /** Borders between districts, by state id (see scripts/build-districts.py). */
  districts: Record<string, string>;
};

export async function getAtlasData(): Promise<AtlasData> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);

  const db = getDb();
  const allTrips = await db
    .select()
    .from(trips)
    .where(eq(trips.published, true))
    .orderBy(desc(trips.startDate), asc(trips.title));
  const allStops = await db
    .select({
      tripId: stops.tripId,
      slug: stops.slug,
      name: stops.name,
      placeKey: stops.placeKey,
      pinX: stops.pinX,
      pinY: stops.pinY,
      title: stops.title,
      photos: stops.photos,
      story: stops.story,
      startDate: stops.startDate,
      endDate: stops.endDate,
      homeSlot: stops.homeSlot,
    })
    .from(stops)
    .where(eq(stops.published, true))
    .orderBy(asc(stops.position));

  const tripById = new Map(allTrips.map((t) => [t.id, t]));
  const stopsOf = (tripId: string) => allStops.filter((s) => s.tripId === tripId);

  // Trips are newest first, so each state's first entry is its latest trip.
  const byState = new Map<string, typeof allTrips>();
  for (const t of allTrips) {
    if (!byState.has(t.stateId)) byState.set(t.stateId, []);
    byState.get(t.stateId)!.push(t);
  }

  const visited: VisitedState[] = [...byState].map(([stateId, ts]) => {
    const stopCount = ts.reduce((n, t) => n + stopsOf(t.id).length, 0);
    const summary = ts.length === 1 ? `1 trip, ${ts[0].title}` : `${ts.length} trips, ${stopCount} stops`;
    return { stateId, name: stateName(stateId), summary };
  });

  const stamps: Stamp[] = [...byState]
    .filter(([, ts]) => ts[0].startDate)
    .slice(0, 3)
    .map(([stateId, ts], i) => {
      const d = ts[0].startDate!;
      return {
        stateId,
        name: stateName(stateId).toUpperCase(),
        date: i === 0 ? `ARRIVED ${stampDay(d)}` : stampMonth(d),
      };
    });

  const tripPhoto = (t: (typeof allTrips)[number]) =>
    t.coverPhoto ?? stopsOf(t.id).find((s) => s.photos.length)?.photos[0] ?? null;
  const previews: Preview[] = [...byState].flatMap(([stateId, ts]) =>
    previewSpots(stateId, Math.min(2, ts.length)).map(([x, y, rotate], i) => ({ stateId, x, y, rotate, photo: tripPhoto(ts[i]) })),
  );

  const cards: HomeCard[] = [];
  for (const t of allTrips) {
    if (t.homeSlot == null) continue;
    cards.push({
      slot: t.homeSlot,
      stateId: t.stateId,
      href: stateHref(t.stateId),
      title: t.title,
      subtitle: `${stateName(t.stateId)}, ${monthYear(t.startDate)}`,
      photo: tripPhoto(t),
      color: tripColor(t.colorIndex),
    });
  }
  for (const s of allStops) {
    const t = tripById.get(s.tripId);
    if (s.homeSlot == null || !t) continue;
    cards.push({
      slot: s.homeSlot,
      stateId: t.stateId,
      href: stateHref(t.stateId),
      title: s.title || s.name,
      subtitle: `${s.name}, ${monthYear(s.startDate ?? t.startDate)}`,
      photo: s.photos[0] ?? null,
      color: tripColor(t.colorIndex),
    });
  }
  const seenSlots = new Set<number>();
  const slotted = cards
    .sort((a, b) => a.slot - b.slot)
    .filter((c) => c.slot >= 1 && c.slot <= HOME_SLOTS && !seenSlots.has(c.slot) && seenSlots.add(c.slot));

  const atlasTrips: AtlasTrip[] = allTrips.map((t) => ({
    slug: t.slug,
    title: t.title,
    stateId: t.stateId,
    color: tripColor(t.colorIndex),
    range: tripRange(t.startDate, t.endDate),
    stops: stopsOf(t.id).map((s) => ({
      slug: s.slug,
      name: s.name,
      placeKey: s.placeKey,
      at: stopPin(s),
      date: dayMonth(s.startDate),
      dateLong: dateLong(s.startDate, s.endDate),
      title: s.title,
      photo: s.photos[0] ?? null,
      hasStory: s.story.length > 0,
      href: stopHref(t.slug, s.slug),
    })),
  }));

  return { totalStates: map.states.length, visited, stamps, previews, cards: slotted, trips: atlasTrips, districts: districtBorders };
}

/** A stop's pin: where the editor placed it, or its named place from the design. */
export function stopPin(s: { pinX: number | null; pinY: number | null; placeKey: string | null }): Point | null {
  if (s.pinX != null && s.pinY != null) return [s.pinX, s.pinY];
  return (s.placeKey && map.places[s.placeKey]) || null;
}

export type StopNavItem = { slug: string; name: string; date: string; href: string; active: boolean };

export type StopPage = {
  trip: { slug: string; title: string; stateId: string; stateName: string };
  stop: {
    slug: string;
    name: string;
    n: number;
    total: number;
    /** The title to show: the written one, or the stop's name. */
    title: string;
    dek: string;
    dateLong: string;
    nights: number | null;
    photos: Photo[];
    details: StopDetail[];
    story: StoryBlock[];
    see: SeeItem[];
    eat: EatItem[];
  };
  nav: StopNavItem[];
};

type TripRow = typeof trips.$inferSelect;
type StopRow = typeof stops.$inferSelect;

/** Builds a post page from its trip, the trip's stops in order, and the content to show. */
export function buildStopPage(
  trip: Pick<TripRow, "slug" | "title" | "stateId">,
  tripStops: Pick<StopRow, "slug" | "name" | "startDate" | "endDate" | "nights">[],
  index: number,
  content: StopContent,
  href: (tripSlug: string, stopSlug: string) => string = stopHref,
): StopPage {
  const s = tripStops[index];
  return {
    trip: { slug: trip.slug, title: trip.title, stateId: trip.stateId, stateName: stateName(trip.stateId) },
    stop: {
      slug: s.slug,
      name: s.name,
      n: index + 1,
      total: tripStops.length,
      title: content.title || s.name,
      dek: content.dek,
      dateLong: dateLong(s.startDate, s.endDate),
      nights: s.nights,
      photos: content.photos,
      details: content.details,
      story: content.story,
      see: content.see,
      eat: content.eat,
    },
    nav: tripStops.map((x) => ({
      slug: x.slug,
      name: x.name,
      date: dayMonth(x.startDate),
      href: href(trip.slug, x.slug),
      active: x.slug === s.slug,
    })),
  };
}

/** The live (published) content columns of a stop. */
export const liveContent = (s: StopRow): StopContent => ({
  title: s.title,
  dek: s.dek,
  photos: s.photos,
  details: s.details,
  story: s.story,
  see: s.see,
  eat: s.eat,
});

export async function getStopPage(tripSlug: string, stopSlug: string): Promise<StopPage | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);

  const db = getDb();
  const [trip] = await db
    .select()
    .from(trips)
    .where(and(eq(trips.slug, tripSlug), eq(trips.published, true)));
  if (!trip) return null;
  const tripStops = await db
    .select()
    .from(stops)
    .where(and(eq(stops.tripId, trip.id), eq(stops.published, true)))
    .orderBy(asc(stops.position));
  const index = tripStops.findIndex((s) => s.slug === stopSlug);
  if (index < 0) return null;
  return buildStopPage(trip, tripStops, index, liveContent(tripStops[index]));
}
