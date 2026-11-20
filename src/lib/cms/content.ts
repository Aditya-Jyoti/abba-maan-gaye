// Checks and helpers for post content sent by the editor. Shared by the browser
// and the server actions; keep it free of runtime imports so the tests can load
// it directly with Node.
import type { EatItem, ImageRef, Photo, SeeItem, StopContent, StopDetail, StoryBlock } from "@/db/schema";

export type BlockType = StoryBlock["type"];

export const BLOCK_TYPES: { type: BlockType; label: string }[] = [
  { type: "p", label: "Paragraph" },
  { type: "h", label: "Heading" },
  { type: "side", label: "Text, photo right" },
  { type: "sideL", label: "Text, photo left" },
  { type: "wide", label: "Wide photo" },
  { type: "duo", label: "Two photos" },
  { type: "trio", label: "Three photos" },
  { type: "quote", label: "Quote" },
  { type: "tip", label: "Local tip" },
];

const LIMITS = {
  short: 300,
  long: 20_000,
  list: 200,
};

const blankPhoto = (): Photo => ({ caption: "" });

export function emptyBlock(type: BlockType): StoryBlock {
  switch (type) {
    case "h":
      return { type, title: "", kicker: "" };
    case "p":
    case "quote":
    case "tip":
      return { type, text: "" };
    case "side":
    case "sideL":
      return { type, text: "", photo: blankPhoto() };
    case "wide":
      return { type, photo: blankPhoto() };
    case "duo":
      return { type, photos: [blankPhoto(), blankPhoto()] };
    case "trio":
      return { type, photos: [blankPhoto(), blankPhoto(), blankPhoto()] };
  }
}

function blockText(b: StoryBlock): string {
  if (b.type === "h") return b.title;
  return "text" in b ? b.text : "";
}

function blockPhotos(b: StoryBlock): Photo[] {
  if ("photos" in b) return b.photos;
  if ("photo" in b) return [b.photo];
  return [];
}

/** Changes a block's layout, keeping as much of its text and photos as fits the new one. */
export function convertBlock(b: StoryBlock, type: BlockType): StoryBlock {
  if (b.type === type) return b;
  const text = blockText(b);
  const photos = blockPhotos(b);
  const photo = (i: number) => photos[i] ?? blankPhoto();
  switch (type) {
    case "h":
      return { type, title: text.replace(/\n/g, " "), kicker: "" };
    case "p":
    case "quote":
    case "tip":
      return { type, text };
    case "side":
    case "sideL":
      return { type, text, photo: photo(0) };
    case "wide":
      return { type, photo: photo(0) };
    case "duo":
      return { type, photos: [photo(0), photo(1)] };
    case "trio":
      return { type, photos: [photo(0), photo(1), photo(2)] };
  }
}

/** "Kasol & Tosh!" -> "kasol-tosh". Falls back to "stop" for text with no letters or digits. */
export function slugify(s: string, fallback = "stop"): string {
  const slug = s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
  return slug || fallback;
}

export const isSlug = (s: unknown): s is string => typeof s === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s) && s.length <= 60;

/** A YYYY-MM-DD date that exists in the calendar. */
export function isIsoDate(s: unknown): s is string {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

// ---- Validation -------------------------------------------------------------

class Invalid extends Error {}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

function str(v: unknown, where: string, max = LIMITS.long): string {
  if (v === undefined || v === null) return "";
  if (typeof v !== "string") throw new Invalid(`${where} must be text`);
  // Control characters other than newlines and tabs never come from typing.
  const clean = v.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "");
  if (clean.length > max) throw new Invalid(`${where} is too long (${clean.length} of ${max} characters)`);
  return clean;
}

const line = (v: unknown, where: string) => str(v, where, LIMITS.short).replace(/\n+/g, " ");

function list<T>(v: unknown, where: string, item: (x: unknown, where: string) => T): T[] {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v)) throw new Invalid(`${where} must be a list`);
  if (v.length > LIMITS.list) throw new Invalid(`${where} has too many items`);
  return v.map((x, i) => item(x, `${where} ${i + 1}`));
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function image(v: unknown, where: string): ImageRef | undefined {
  if (v === undefined || v === null) return undefined;
  if (!isObject(v) || typeof v.id !== "string" || !UUID.test(v.id)) throw new Invalid(`${where} has a bad image`);
  const dim = (n: unknown) => (Number.isInteger(n) && (n as number) > 0 && (n as number) < 100_000 ? (n as number) : 0);
  const width = dim(v.width);
  const height = dim(v.height);
  if (!width || !height) throw new Invalid(`${where} has a bad image size`);
  return { id: v.id, width, height };
}

function photo(v: unknown, where: string): Photo {
  if (!isObject(v)) throw new Invalid(`${where} must be a photo`);
  const img = image(v.image, where);
  const p: Photo = { caption: line(v.caption, `${where} caption`) };
  if (img) p.image = img;
  return p;
}

function block(v: unknown, where: string): StoryBlock {
  if (!isObject(v)) throw new Invalid(`${where} must be a block`);
  const photos = (n: number) => {
    const ps = list(v.photos, `${where} photos`, photo);
    if (ps.length !== n) throw new Invalid(`${where} needs ${n} photos`);
    return ps;
  };
  switch (v.type) {
    case "h": {
      const kicker = line(v.kicker, `${where} kicker`);
      return kicker ? { type: "h", title: line(v.title, where), kicker } : { type: "h", title: line(v.title, where) };
    }
    case "p":
    case "quote":
    case "tip":
      return { type: v.type, text: str(v.text, where) };
    case "side":
    case "sideL":
      return { type: v.type, text: str(v.text, where), photo: photo(v.photo, `${where} photo`) };
    case "wide":
      return { type: "wide", photo: photo(v.photo, `${where} photo`) };
    case "duo":
      return { type: "duo", photos: photos(2) as [Photo, Photo] };
    case "trio":
      return { type: "trio", photos: photos(3) as [Photo, Photo, Photo] };
    default:
      throw new Invalid(`${where} has an unknown type`);
  }
}

const detail = (v: unknown, where: string): StopDetail => {
  if (!isObject(v)) throw new Invalid(`${where} must be a note`);
  return { label: line(v.label, `${where} label`), value: line(v.value, `${where} value`) };
};

const see = (v: unknown, where: string): SeeItem => {
  if (!isObject(v)) throw new Invalid(`${where} must be a place`);
  const item: SeeItem = {
    name: line(v.name, `${where} name`),
    line: str(v.line, `${where} description`, 2000),
    meta: line(v.meta, `${where} details`),
  };
  if (v.photo !== undefined && v.photo !== null) item.photo = photo(v.photo, `${where} photo`);
  return item;
};

const eat = (v: unknown, where: string): EatItem => {
  if (!isObject(v)) throw new Invalid(`${where} must be a dish`);
  return {
    name: line(v.name, `${where} name`),
    line: str(v.line, `${where} description`, 2000),
    price: line(v.price, `${where} price`),
  };
};

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

/** Checks content from the editor and returns a cleaned copy with only known fields. */
export function parseStopContent(input: unknown): Parsed<StopContent> {
  try {
    if (!isObject(input)) throw new Invalid("Content is missing");
    return {
      ok: true,
      value: {
        title: line(input.title, "Title"),
        dek: str(input.dek, "Summary", 1000),
        photos: list(input.photos, "Camera roll photo", photo),
        details: list(input.details, "Trip note", detail),
        story: list(input.story, "Story block", block),
        see: list(input.see, "Place to see", see),
        eat: list(input.eat, "Dish", eat),
      },
    };
  } catch (err) {
    if (err instanceof Invalid) return { ok: false, error: err.message };
    throw err;
  }
}

/** Every image id used in the content, for checking uploads exist. */
export function contentImageIds(c: StopContent): string[] {
  const ids = new Set<string>();
  const add = (p?: Photo) => p?.image && ids.add(p.image.id);
  c.photos.forEach(add);
  c.see.forEach((s) => add(s.photo));
  c.story.forEach((b) => blockPhotos(b).forEach(add));
  return [...ids];
}
