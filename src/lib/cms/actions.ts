"use server";

import { and, asc, eq, inArray, ne, sql } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { getDb } from "@/db";
import { media, stopRevisions, stops, trips, users, type StopContent } from "@/db/schema";
import { getEditor } from "@/lib/auth/session";
import { CONTENT_TAG, liveContent } from "@/lib/content";
import { HOME_SLOTS, map, stateById, TRIP_COLORS, type Point } from "@/lib/map";
import { homeHref, stopEditHref } from "@/lib/routes";
import { contentImageIds, isIsoDate, isSlug, parseStopContent, slugify } from "./content";
import { getRevisions, type RevisionSummary, type StopSettings, type TripSettings } from "./queries";

// Every action checks the session itself and validates its input: they are public
// endpoints that anyone can call, whatever page they appear on.

export type Conflict = { status: "conflict"; version: number; by: string | null; at: string | null };
export type Failure = { status: "signed-out" } | { status: "error"; message: string } | Conflict;

const signedOut = { status: "signed-out" } as const;
const error = (message: string) => ({ status: "error", message }) as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const isId = (v: unknown): v is string => typeof v === "string" && UUID.test(v);
const isVersion = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0;

async function conflictFor(stopId: string): Promise<Conflict | null> {
  const [row] = await getDb()
    .select({ version: stops.draftVersion, at: stops.draftUpdatedAt, by: users.name })
    .from(stops)
    .leftJoin(users, eq(users.id, stops.draftUpdatedBy))
    .where(eq(stops.id, stopId));
  if (!row) return null;
  return { status: "conflict", version: row.version, by: row.by, at: row.at?.toISOString() ?? null };
}

// ---- Drafts -------------------------------------------------------------------

export type SaveResult = { status: "saved"; version: number; savedAt: string } | Failure;

/**
 * Saves the editor's copy of a stop's content as its draft. `version` is the draft
 * version the editor last saw; if someone else has saved since, nothing is written
 * and the conflict is returned instead.
 */
export async function saveDraft(input: { stopId: string; version: number; content: unknown }): Promise<SaveResult> {
  const editor = await getEditor();
  if (!editor) return signedOut;
  if (!isId(input?.stopId) || !isVersion(input.version)) return error("Bad request");
  const parsed = parseStopContent(input.content);
  if (!parsed.ok) return error(parsed.error);
  const missing = await missingImages(parsed.value);
  if (missing) return error("Some photos are no longer on the server. Upload them again.");

  const [row] = await getDb()
    .update(stops)
    .set({
      draft: parsed.value,
      draftVersion: sql`${stops.draftVersion} + 1`,
      draftUpdatedAt: new Date(),
      draftUpdatedBy: editor.id,
    })
    .where(and(eq(stops.id, input.stopId), eq(stops.draftVersion, input.version)))
    .returning({ version: stops.draftVersion, at: stops.draftUpdatedAt });
  if (row) return { status: "saved", version: row.version, savedAt: row.at!.toISOString() };
  return (await conflictFor(input.stopId)) ?? error("This stop has been deleted.");
}

async function missingImages(content: StopContent): Promise<boolean> {
  const ids = contentImageIds(content);
  if (!ids.length) return false;
  const found = await getDb().select({ id: media.id }).from(media).where(inArray(media.id, ids));
  return found.length !== ids.length;
}

export type PublishResult = { status: "published"; version: number; publishedAt: string } | Failure;

/** Makes the draft (or the live copy, if there is no draft) the published post. Also shows its trip. */
export async function publishStop(input: { stopId: string; version: number }): Promise<PublishResult> {
  const editor = await getEditor();
  if (!editor) return signedOut;
  if (!isId(input?.stopId) || !isVersion(input.version)) return error("Bad request");

  const result = await getDb().transaction(async (tx) => {
    const [s] = await tx.select().from(stops).where(eq(stops.id, input.stopId)).for("update");
    if (!s) return error("This stop has been deleted.");
    if (s.draftVersion !== input.version) return null;
    const content = s.draft ?? liveContent(s);
    const now = new Date();
    await tx.insert(stopRevisions).values({ stopId: s.id, content, publishedAt: now, publishedBy: editor.id });
    const [row] = await tx
      .update(stops)
      .set({ ...content, published: true, draft: null, draftVersion: s.draftVersion + 1, draftUpdatedAt: now, draftUpdatedBy: editor.id })
      .where(eq(stops.id, s.id))
      .returning({ version: stops.draftVersion });
    await tx.update(trips).set({ published: true }).where(and(eq(trips.id, s.tripId), eq(trips.published, false)));
    return { status: "published", version: row.version, publishedAt: now.toISOString() } as const;
  });
  if (!result) return (await conflictFor(input.stopId)) ?? error("This stop has been deleted.");
  if (result.status === "published") updateTag(CONTENT_TAG);
  return result;
}

export type ContentResult = { status: "ok"; version: number; content: StopContent } | Failure;

/** Throws away the draft and goes back to the published copy. */
export async function discardDraft(input: { stopId: string; version: number }): Promise<ContentResult> {
  const editor = await getEditor();
  if (!editor) return signedOut;
  if (!isId(input?.stopId) || !isVersion(input.version)) return error("Bad request");
  const [row] = await getDb()
    .update(stops)
    .set({ draft: null, draftVersion: sql`${stops.draftVersion} + 1`, draftUpdatedAt: new Date(), draftUpdatedBy: editor.id })
    .where(and(eq(stops.id, input.stopId), eq(stops.draftVersion, input.version)))
    .returning();
  if (row) return { status: "ok", version: row.draftVersion, content: liveContent(row) };
  return (await conflictFor(input.stopId)) ?? error("This stop has been deleted.");
}

/** Copies an earlier published version into the draft, to review and publish again. */
export async function restoreRevision(input: { stopId: string; revisionId: string; version: number }): Promise<ContentResult> {
  const editor = await getEditor();
  if (!editor) return signedOut;
  if (!isId(input?.stopId) || !isId(input.revisionId) || !isVersion(input.version)) return error("Bad request");
  const db = getDb();
  const [rev] = await db
    .select({ content: stopRevisions.content })
    .from(stopRevisions)
    .where(and(eq(stopRevisions.id, input.revisionId), eq(stopRevisions.stopId, input.stopId)));
  if (!rev) return error("That version no longer exists.");
  const [row] = await db
    .update(stops)
    .set({ draft: rev.content, draftVersion: sql`${stops.draftVersion} + 1`, draftUpdatedAt: new Date(), draftUpdatedBy: editor.id })
    .where(and(eq(stops.id, input.stopId), eq(stops.draftVersion, input.version)))
    .returning({ version: stops.draftVersion });
  if (row) return { status: "ok", version: row.version, content: rev.content };
  return (await conflictFor(input.stopId)) ?? error("This stop has been deleted.");
}

export async function listRevisions(input: { stopId: string }): Promise<RevisionSummary[] | Failure> {
  if (!(await getEditor())) return signedOut;
  if (!isId(input?.stopId)) return error("Bad request");
  return getRevisions(input.stopId);
}

/** Hides a stop from the site. Its content and history are kept. */
export async function unpublishStop(input: { stopId: string }): Promise<{ status: "ok" } | Failure> {
  if (!(await getEditor())) return signedOut;
  if (!isId(input?.stopId)) return error("Bad request");
  await getDb().update(stops).set({ published: false }).where(eq(stops.id, input.stopId));
  updateTag(CONTENT_TAG);
  return { status: "ok" };
}

// ---- Stop and trip settings --------------------------------------------------

type Checked<T> = { ok: true; value: T } | { ok: false; message: string };

function checkDates(start: unknown, end: unknown): Checked<{ startDate: string | null; endDate: string | null }> {
  const startDate = start === "" || start == null ? null : start;
  const endDate = end === "" || end == null ? null : end;
  if (startDate !== null && !isIsoDate(startDate)) return { ok: false, message: "The start date isn't a real date." };
  if (endDate !== null && !isIsoDate(endDate)) return { ok: false, message: "The end date isn't a real date." };
  if (endDate && !startDate) return { ok: false, message: "Add a start date before the end date." };
  if (startDate && endDate && endDate < startDate) return { ok: false, message: "The end date is before the start date." };
  return { ok: true, value: { startDate, endDate } };
}

function checkName(v: unknown, what: string): Checked<string> {
  const s = typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "";
  if (!s) return { ok: false, message: `Give the ${what} a name.` };
  if (s.length > 120) return { ok: false, message: `The ${what} name is too long.` };
  return { ok: true, value: s };
}

const checkSlot = (v: unknown): v is number | null => v === null || (Number.isInteger(v) && (v as number) >= 1 && (v as number) <= HOME_SLOTS);

function checkPin(v: unknown): v is Point | null {
  if (v === null) return true;
  return (
    Array.isArray(v) &&
    v.length === 2 &&
    v.every((n) => typeof n === "number" && Number.isFinite(n)) &&
    v[0] >= 0 &&
    v[0] <= map.w &&
    v[1] >= 0 &&
    v[1] <= map.h
  );
}

/** Frees a home-page slot so the item being saved can take it. */
type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

async function claimSlot(tx: Tx, slot: number | null) {
  if (slot === null) return;
  await tx.update(trips).set({ homeSlot: null }).where(eq(trips.homeSlot, slot));
  await tx.update(stops).set({ homeSlot: null }).where(eq(stops.homeSlot, slot));
}

export type SettingsResult = { status: "ok" } | Failure;

export async function updateStopSettings(input: { stopId: string; settings: StopSettings }): Promise<SettingsResult> {
  if (!(await getEditor())) return signedOut;
  const s = input?.settings;
  if (!isId(input?.stopId) || typeof s !== "object" || s === null) return error("Bad request");
  const name = checkName(s.name, "stop");
  if (!name.ok) return error(name.message);
  if (!isSlug(s.slug)) return error("The URL can only use lowercase letters, digits and single dashes.");
  const dates = checkDates(s.startDate, s.endDate);
  if (!dates.ok) return error(dates.message);
  if (s.nights !== null && !(Number.isInteger(s.nights) && s.nights >= 0 && s.nights <= 365)) {
    return error("Nights must be a whole number up to 365.");
  }
  if (!checkPin(s.pin)) return error("The map pin is off the map.");
  if (!checkSlot(s.homeSlot)) return error(`Pick a home page spot from 1 to ${HOME_SLOTS}.`);

  const db = getDb();
  const [current] = await db
    .select({ tripId: stops.tripId, slug: stops.slug, tripSlug: trips.slug })
    .from(stops)
    .innerJoin(trips, eq(trips.id, stops.tripId))
    .where(eq(stops.id, input.stopId));
  if (!current) return error("This stop has been deleted.");
  const [taken] = await db
    .select({ id: stops.id })
    .from(stops)
    .where(and(eq(stops.tripId, current.tripId), eq(stops.slug, s.slug), ne(stops.id, input.stopId)));
  if (taken) return error("Another stop on this trip already uses that URL.");

  await db.transaction(async (tx) => {
    await claimSlot(tx, s.homeSlot);
    await tx
      .update(stops)
      .set({
        name: name.value,
        slug: s.slug,
        ...dates.value,
        nights: s.nights,
        pinX: s.pin?.[0] ?? null,
        pinY: s.pin?.[1] ?? null,
        homeSlot: s.homeSlot,
      })
      .where(eq(stops.id, input.stopId));
  });
  updateTag(CONTENT_TAG);
  if (s.slug !== current.slug) redirect(stopEditHref(current.tripSlug, s.slug), RedirectType.replace);
  return { status: "ok" };
}

export async function updateTripSettings(input: {
  tripId: string;
  settings: TripSettings;
  /** The stop being edited, to come back to if the trip's URL changes. */
  stopSlug: string;
}): Promise<SettingsResult> {
  if (!(await getEditor())) return signedOut;
  const t = input?.settings;
  if (!isId(input?.tripId) || typeof t !== "object" || t === null || !isSlug(input.stopSlug)) return error("Bad request");
  const title = checkName(t.title, "trip");
  if (!title.ok) return error(title.message);
  if (!isSlug(t.slug)) return error("The URL can only use lowercase letters, digits and single dashes.");
  if (typeof t.stateId !== "string" || !stateById.has(t.stateId)) return error("Pick the state this trip was in.");
  const dates = checkDates(t.startDate, t.endDate);
  if (!dates.ok) return error(dates.message);
  if (!(Number.isInteger(t.colorIndex) && t.colorIndex >= 0 && t.colorIndex < TRIP_COLORS.length)) return error("Pick a route colour.");
  if (!checkSlot(t.homeSlot)) return error(`Pick a home page spot from 1 to ${HOME_SLOTS}.`);

  const db = getDb();
  const [current] = await db.select({ slug: trips.slug, stateId: trips.stateId }).from(trips).where(eq(trips.id, input.tripId));
  if (!current) return error("This trip has been deleted.");
  const [taken] = await db
    .select({ id: trips.id })
    .from(trips)
    .where(and(eq(trips.slug, t.slug), ne(trips.id, input.tripId)));
  if (taken) return error("Another trip already uses that URL.");

  await db.transaction(async (tx) => {
    await claimSlot(tx, t.homeSlot);
    await tx
      .update(trips)
      .set({ title: title.value, slug: t.slug, stateId: t.stateId, ...dates.value, colorIndex: t.colorIndex, homeSlot: t.homeSlot })
      .where(eq(trips.id, input.tripId));
    // Pins placed in the old state would be somewhere else entirely.
    if (t.stateId !== current.stateId) {
      await tx.update(stops).set({ pinX: null, pinY: null }).where(eq(stops.tripId, input.tripId));
    }
  });
  updateTag(CONTENT_TAG);
  if (t.slug !== current.slug) redirect(stopEditHref(t.slug, input.stopSlug), RedirectType.replace);
  return { status: "ok" };
}

export async function setTripPublished(input: { tripId: string; published: boolean }): Promise<SettingsResult> {
  if (!(await getEditor())) return signedOut;
  if (!isId(input?.tripId) || typeof input.published !== "boolean") return error("Bad request");
  await getDb().update(trips).set({ published: input.published }).where(eq(trips.id, input.tripId));
  updateTag(CONTENT_TAG);
  return { status: "ok" };
}

/** Moves a stop one place earlier (-1) or later (1) in its trip. */
export async function moveStop(input: { stopId: string; by: -1 | 1 }): Promise<SettingsResult> {
  if (!(await getEditor())) return signedOut;
  if (!isId(input?.stopId) || (input.by !== -1 && input.by !== 1)) return error("Bad request");
  await getDb().transaction(async (tx) => {
    const [s] = await tx.select({ tripId: stops.tripId }).from(stops).where(eq(stops.id, input.stopId));
    if (!s) return;
    const order = await tx
      .select({ id: stops.id })
      .from(stops)
      .where(eq(stops.tripId, s.tripId))
      .orderBy(asc(stops.position))
      .for("update");
    const i = order.findIndex((x) => x.id === input.stopId);
    const j = i + input.by;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    // Renumber the whole trip, which also repairs any gaps or duplicate positions.
    for (const [position, x] of order.entries()) {
      await tx.update(stops).set({ position }).where(eq(stops.id, x.id));
    }
  });
  updateTag(CONTENT_TAG);
  return { status: "ok" };
}

async function uniqueSlug(base: string, taken: (slug: string) => Promise<boolean>): Promise<string> {
  for (let n = 1; ; n++) {
    const slug = n === 1 ? base : `${base.slice(0, 56)}-${n}`;
    if (!(await taken(slug))) return slug;
  }
}

const emptyContent = (): StopContent => ({ title: "", dek: "", photos: [], details: [], story: [], see: [], eat: [] });

/** Adds a hidden stop at the end of a trip and opens it in the editor. */
export async function createStop(input: { tripId: string; name: string }): Promise<Failure> {
  if (!(await getEditor())) return signedOut;
  if (!isId(input?.tripId)) return error("Bad request");
  const name = checkName(input.name, "stop");
  if (!name.ok) return error(name.message);
  const db = getDb();
  const [trip] = await db.select({ slug: trips.slug }).from(trips).where(eq(trips.id, input.tripId));
  if (!trip) return error("This trip has been deleted.");
  const slug = await uniqueSlug(slugify(name.value), async (x) => {
    const [row] = await db.select({ id: stops.id }).from(stops).where(and(eq(stops.tripId, input.tripId), eq(stops.slug, x)));
    return !!row;
  });
  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${stops.position}) + 1, 0)::int` })
    .from(stops)
    .where(eq(stops.tripId, input.tripId));
  await db.insert(stops).values({ tripId: input.tripId, position: next, slug, name: name.value, ...emptyContent() });
  updateTag(CONTENT_TAG);
  redirect(stopEditHref(trip.slug, slug));
}

/** Deletes a stop with its drafts and history, then opens a neighbouring stop. */
export async function deleteStop(input: { stopId: string }): Promise<Failure> {
  if (!(await getEditor())) return signedOut;
  if (!isId(input?.stopId)) return error("Bad request");
  const db = getDb();
  const [s] = await db
    .select({ tripId: stops.tripId, position: stops.position, tripSlug: trips.slug })
    .from(stops)
    .innerJoin(trips, eq(trips.id, stops.tripId))
    .where(eq(stops.id, input.stopId));
  if (!s) redirect(homeHref);
  await db.delete(stops).where(eq(stops.id, input.stopId));
  const rest = await db.select({ slug: stops.slug, position: stops.position }).from(stops).where(eq(stops.tripId, s.tripId)).orderBy(asc(stops.position));
  updateTag(CONTENT_TAG);
  const next = rest.find((x) => x.position > s.position) ?? rest.at(-1);
  redirect(next ? stopEditHref(s.tripSlug, next.slug) : homeHref, RedirectType.replace);
}

/** Starts a hidden trip with its first stop, and opens that stop in the editor. */
export async function createTrip(input: { title: string; stateId: string; startDate: string; stopName: string }): Promise<Failure> {
  if (!(await getEditor())) return signedOut;
  const title = checkName(input?.title, "trip");
  if (!title.ok) return error(title.message);
  if (typeof input.stateId !== "string" || !stateById.has(input.stateId)) return error("Pick the state this trip was in.");
  const dates = checkDates(input.startDate, null);
  if (!dates.ok) return error(dates.message);
  const stopName = checkName(input.stopName, "first stop");
  if (!stopName.ok) return error(stopName.message);

  const db = getDb();
  const year = dates.value.startDate?.slice(0, 4);
  const tripSlug = await uniqueSlug(slugify(year ? `${title.value} ${year}` : title.value, "trip"), async (x) => {
    const [row] = await db.select({ id: trips.id }).from(trips).where(eq(trips.slug, x));
    return !!row;
  });
  // Alternate route colours between trips in the same state.
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(trips)
    .where(eq(trips.stateId, input.stateId));
  const stopSlug = slugify(stopName.value);
  await db.transaction(async (tx) => {
    const [trip] = await tx
      .insert(trips)
      .values({ slug: tripSlug, title: title.value, stateId: input.stateId, ...dates.value, colorIndex: count % TRIP_COLORS.length })
      .returning({ id: trips.id });
    await tx.insert(stops).values({
      tripId: trip.id,
      position: 0,
      slug: stopSlug,
      name: stopName.value,
      startDate: dates.value.startDate,
      ...emptyContent(),
    });
  });
  updateTag(CONTENT_TAG);
  redirect(stopEditHref(tripSlug, stopSlug));
}

/** Deletes a trip with all its stops and their history. */
export async function deleteTrip(input: { tripId: string }): Promise<Failure> {
  if (!(await getEditor())) return signedOut;
  if (!isId(input?.tripId)) return error("Bad request");
  await getDb().delete(trips).where(eq(trips.id, input.tripId));
  updateTag(CONTENT_TAG);
  redirect(homeHref, RedirectType.replace);
}
