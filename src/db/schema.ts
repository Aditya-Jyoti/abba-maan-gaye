import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Content model, first taken from the data in design/source/travel-core.js.

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const trips = pgTable("trips", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  // Matches a state id in src/data/india-map.json, e.g. "maharashtra".
  stateId: text("state_id").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  colorIndex: integer("color_index").notNull().default(0),
  coverPhoto: jsonb("cover_photo").$type<Photo>(),
  // Position (1-6) of this trip's card on the home page, if shown there.
  homeSlot: integer("home_slot"),
  published: boolean("published").notNull().default(false),
  ...timestamps,
});

// An uploaded image, served from /media in fixed widths (see src/lib/media.ts).
export type ImageRef = { id: string; width: number; height: number };

// `image` is unset until a real photo is uploaded; a striped placeholder stands in.
export type Photo = { caption: string; image?: ImageRef };

export type StoryBlock =
  | { type: "h"; title: string; kicker?: string }
  | { type: "p"; text: string }
  | { type: "side" | "sideL"; text: string; photo: Photo }
  | { type: "duo"; photos: [Photo, Photo] }
  | { type: "trio"; photos: [Photo, Photo, Photo] }
  | { type: "wide"; photo: Photo }
  | { type: "quote"; text: string }
  | { type: "tip"; text: string };

export type StopDetail = { label: string; value: string };
export type SeeItem = { name: string; line: string; meta: string; photo?: Photo };
export type EatItem = { name: string; line: string; price: string };

/**
 * The part of a stop that is written on the post page. Edits are saved as a draft
 * and only replace the live copy when published.
 */
export type StopContent = {
  title: string;
  dek: string;
  photos: Photo[];
  details: StopDetail[];
  story: StoryBlock[];
  see: SeeItem[];
  eat: EatItem[];
};

export const stops = pgTable(
  "stops",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    // Matches a place id in src/data/india-map.json, e.g. "lonavala".
    placeKey: text("place_key"),
    // Pin position in map canvas coordinates, set from the editor. Overrides placeKey.
    pinX: real("pin_x"),
    pinY: real("pin_y"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    nights: integer("nights"),
    title: text("title").notNull().default(""),
    dek: text("dek").notNull().default(""),
    quote: text("quote").notNull().default(""),
    photos: jsonb("photos").$type<Photo[]>().notNull().default([]),
    details: jsonb("details").$type<StopDetail[]>().notNull().default([]),
    story: jsonb("story").$type<StoryBlock[]>().notNull().default([]),
    see: jsonb("see").$type<SeeItem[]>().notNull().default([]),
    eat: jsonb("eat").$type<EatItem[]>().notNull().default([]),
    // Position (1-6) of this stop's card on the home page, if shown there.
    homeSlot: integer("home_slot"),
    published: boolean("published").notNull().default(false),
    // Unpublished edits to the content columns above, or null when there are none.
    draft: jsonb("draft").$type<StopContent>(),
    // Bumped on every draft save and publish, so two editors can't overwrite each other unnoticed.
    draftVersion: integer("draft_version").notNull().default(0),
    draftUpdatedAt: timestamp("draft_updated_at", { withTimezone: true }),
    draftUpdatedBy: uuid("draft_updated_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [uniqueIndex("stops_trip_slug_idx").on(t.tripId, t.slug)],
);

/** Every published version of a stop's content, newest last. */
export const stopRevisions = pgTable(
  "stop_revisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stopId: uuid("stop_id")
      .notNull()
      .references(() => stops.id, { onDelete: "cascade" }),
    content: jsonb("content").$type<StopContent>().notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
    publishedBy: uuid("published_by").references(() => users.id, { onDelete: "set null" }),
  },
  (t) => [index("stop_revisions_stop_idx").on(t.stopId, t.publishedAt)],
);

/** Uploaded images. The files live in MEDIA_DIR, named by id and width. */
export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  bytes: integer("bytes").notNull(),
  originalName: text("original_name").notNull().default(""),
  uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---- Editors ---------------------------------------------------------------

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Stored lowercased.
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  // scrypt hash, see src/lib/auth/password.mjs.
  passwordHash: text("password_hash").notNull(),
  ...timestamps,
});

export const sessions = pgTable(
  "sessions",
  {
    // SHA-256 of the token in the cookie, so a database leak can't be replayed.
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);
