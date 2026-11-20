import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { getDb } from "@/db";
import { sessions, users } from "@/db/schema";
import { SESSION_COOKIE, SESSION_DAYS } from "./constants";

/** The signed-in editor, as exposed to pages. */
export type Viewer = { id: string; name: string; email: string };

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

async function cookieIsSecure(): Promise<boolean> {
  const setting = process.env.COOKIE_SECURE;
  if (setting === "true") return true;
  if (setting === "false") return false;
  // Behind an HTTPS proxy the original scheme arrives in X-Forwarded-Proto.
  const proto = (await headers()).get("x-forwarded-proto")?.split(",")[0].trim();
  return proto === "https";
}

/** Starts a session and sets its cookie. Only callable from a Server Action. */
export async function createSession(userId: string): Promise<void> {
  const db = getDb();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  await db.insert(sessions).values({ id: hashToken(token), userId, expiresAt });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: await cookieIsSecure(),
    path: "/",
    expires: expiresAt,
  });
}

/** Ends the current session, if any. Only callable from a Server Action. */
export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await getDb().delete(sessions).where(eq(sessions.id, hashToken(token)));
  jar.delete(SESSION_COOKIE);
}

async function lookupViewer(): Promise<Viewer | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [row] = await getDb()
    .select({ id: users.id, name: users.name, email: users.email })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, hashToken(token)), gt(sessions.expiresAt, new Date())));
  return row ?? null;
}

/** The signed-in editor for this request, checked against the database. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  // Session checks compare against the current time, so they always run per request.
  await connection();
  return lookupViewer();
});

/**
 * The signed-in editor, for Server Actions and Route Handlers. Every one that
 * changes content must call this itself: being on an edit page proves nothing.
 */
export const getEditor = lookupViewer;

/** The signed-in editor, or a redirect to the login page that returns to `returnTo`. */
export async function requireViewer(returnTo: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return viewer;
}
