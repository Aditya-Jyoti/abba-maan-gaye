import { randomUUID } from "node:crypto";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import sharp, { type Metadata } from "sharp";
import { MEDIA_WIDTHS, mediaFileName } from "@/lib/routes";

/** Where uploaded images are written. A Docker volume in production. */
// Resolved at runtime only; the ignore comments keep the build from tracing the whole project into the standalone output.
export const mediaDir = () =>
  path.resolve(/* turbopackIgnore: true */ process.env.MEDIA_DIR || path.join(/* turbopackIgnore: true */ process.cwd(), "media"));

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

const ACCEPTED = new Set(["jpeg", "png", "webp", "avif", "gif", "tiff", "heif"]);

export class UploadError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export type StoredImage = { id: string; width: number; height: number; bytes: number };

/**
 * Turns an uploaded image into WebP copies at each of MEDIA_WIDTHS. The copies are
 * rotated upright and carry no metadata, so camera GPS positions never get published.
 */
export async function storeImage(input: Buffer): Promise<StoredImage> {
  let meta: Metadata;
  try {
    meta = await sharp(input, { limitInputPixels: 120_000_000 }).metadata();
  } catch {
    throw new UploadError("That file isn't an image we can read.", 415);
  }
  if (!meta.format || !ACCEPTED.has(meta.format)) {
    throw new UploadError("Upload a JPEG, PNG, WebP, AVIF or GIF image.", 415);
  }

  const id = randomUUID();
  const dir = mediaDir();
  await mkdir(dir, { recursive: true });
  let width = 0;
  let height = 0;
  let bytes = 0;
  try {
    for (const w of MEDIA_WIDTHS) {
      const info = await sharp(input, { limitInputPixels: 120_000_000 })
        .rotate()
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(path.join(/* turbopackIgnore: true */ dir, mediaFileName(id, w)));
      // The largest copy has the true proportions with the least rounding.
      ({ width, height } = info);
      bytes += info.size;
    }
  } catch (err) {
    await removeImage(id);
    if (err instanceof Error && /pixel limit|unsupported|corrupt|bad/i.test(err.message)) {
      throw new UploadError("That image couldn't be processed.", 415);
    }
    throw err;
  }
  return { id, width, height, bytes };
}

export async function removeImage(id: string): Promise<void> {
  await Promise.all(MEDIA_WIDTHS.map((w) => rm(path.join(/* turbopackIgnore: true */ mediaDir(), mediaFileName(id, w)), { force: true })));
}
