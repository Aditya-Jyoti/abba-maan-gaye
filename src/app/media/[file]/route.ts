import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { mediaDir } from "@/lib/media";

// Only names the upload handler writes, so no path can leave the media folder.
const NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-\d{2,5}\.webp$/;

export async function GET(_request: Request, ctx: RouteContext<"/media/[file]">) {
  const { file } = await ctx.params;
  if (!NAME.test(file)) return new Response("Not found", { status: 404 });
  const full = path.join(mediaDir(), file);
  try {
    const info = await stat(full);
    const body = Readable.toWeb(createReadStream(full)) as ReadableStream;
    return new Response(body, {
      headers: {
        "Content-Type": "image/webp",
        "Content-Length": String(info.size),
        // Each upload gets a new name, so a file never changes.
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
