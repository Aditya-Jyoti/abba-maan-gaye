import type { AtlasData } from "@/lib/content";

export function findStop(data: AtlasData, tripSlug: string, stopSlug: string) {
  const trip = data.trips.find((t) => t.slug === tripSlug);
  const index = trip ? trip.stops.findIndex((s) => s.slug === stopSlug) : -1;
  return trip && index >= 0 ? { trip, index, stop: trip.stops[index] } : null;
}
