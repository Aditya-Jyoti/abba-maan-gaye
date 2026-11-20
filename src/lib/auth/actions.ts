"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, verifyPassword } from "./password.mjs";
import { clearFailures, isLimited, recordFailure } from "./rate-limit";
import { safeNext } from "./redirect.mjs";
import { createSession, endSession } from "./session";

export type LoginState = { error?: string; email?: string };

// Checked against when the email is unknown, so both cases take the same time.
let dummyHash: Promise<string> | null = null;

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(form.get("password") ?? "");
  const next = safeNext(form.get("next"));
  if (!email || !password) return { error: "Enter your email and password.", email };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const keys = [`ip:${ip}`, `email:${email}`];
  if (keys.some((k) => isLimited(k))) {
    return { error: "Too many failed attempts. Try again in 15 minutes.", email };
  }

  const [user] = await getDb()
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email));
  dummyHash ??= hashPassword("not-a-real-password");
  const ok = await verifyPassword(password, user?.passwordHash ?? (await dummyHash));
  if (!user || !ok) {
    keys.forEach((k) => recordFailure(k));
    return { error: "That email and password don't match.", email };
  }

  clearFailures(`email:${email}`);
  await createSession(user.id);
  redirect(next);
}

export async function logout(form: FormData): Promise<void> {
  await endSession();
  // Leave edit pages, since they need a session.
  const next = safeNext(form.get("next")).replace(/\/edit$/, "") || "/";
  redirect(next);
}
