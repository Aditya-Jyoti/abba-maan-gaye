import type { ImageRef } from "@/db/schema";
import type { BlockType } from "@/lib/cms/content";

/** A location in the stop's content, e.g. ["story", 2, "photo", "caption"]. */
export type Path = (string | number)[];

/** What the post page needs to edit itself. Only present on the edit page. */
export type EditApi = {
  set(path: Path, value: unknown): void;
  insert(path: Path, index: number, item: unknown): void;
  remove(path: Path, index: number): void;
  move(path: Path, from: number, to: number): void;
  /** Stable keys for the story blocks, in order. */
  blockIds: string[];
  addBlock(index: number, type: BlockType): void;
  convertBlock(index: number, type: BlockType): void;
  /** Enter in a paragraph: keep `before` in it and start a new paragraph with `after`. */
  splitBlock(index: number, before: string, after: string): void;
  /** Backspace in an empty block: remove it and move to the end of the one before. */
  removeEmptyBlock(index: number): void;
  upload(files: File[]): Promise<ImageRef[]>;
};

export async function uploadImage(file: File): Promise<ImageRef> {
  const body = new FormData();
  body.append("file", file);
  let res: Response;
  try {
    res = await fetch("/api/media", { method: "POST", body });
  } catch {
    throw new Error("Couldn't reach the server. Check your connection and try again.");
  }
  const data = (await res.json().catch(() => ({}))) as Partial<ImageRef> & { error?: string };
  if (!res.ok || !data.id) throw new Error(data.error ?? `Upload failed (${res.status}).`);
  return { id: data.id, width: data.width!, height: data.height! };
}
