import { getDb } from "@/db";
import { media } from "@/db/schema";
import { getEditor } from "@/lib/auth/session";
import { MAX_UPLOAD_BYTES, removeImage, storeImage, UploadError } from "@/lib/media";

const fail = (error: string, status: number) => Response.json({ error }, { status });

/** Browsers send Origin on every POST; refusing other sites' requests stops cross-site uploads. */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("x-forwarded-host")?.split(",")[0].trim() || request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Upload one image as multipart form data in a field named "file". */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("Uploads must come from this site.", 403);
  const editor = await getEditor();
  if (!editor) return fail("Your session has ended. Log in again to upload.", 401);

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_UPLOAD_BYTES + 64 * 1024) return fail("Images can be up to 25 MB.", 413);

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return fail("The upload didn't arrive in one piece. Try again.", 400);
  }
  if (!(file instanceof File) || file.size === 0) return fail("Choose an image to upload.", 400);
  if (file.size > MAX_UPLOAD_BYTES) return fail("Images can be up to 25 MB.", 413);

  try {
    const stored = await storeImage(Buffer.from(await file.arrayBuffer()));
    try {
      await getDb()
        .insert(media)
        .values({ ...stored, originalName: file.name.slice(0, 200), uploadedBy: editor.id });
    } catch (err) {
      await removeImage(stored.id);
      throw err;
    }
    return Response.json({ id: stored.id, width: stored.width, height: stored.height }, { status: 201 });
  } catch (err) {
    if (err instanceof UploadError) return fail(err.message, err.status);
    console.error("Upload failed:", err);
    return fail("The upload failed on the server. Try again.", 500);
  }
}
