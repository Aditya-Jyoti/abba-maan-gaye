import { sql } from "drizzle-orm";
import { connection } from "next/server";
import { getDb } from "@/db";

export async function GET() {
  await connection();
  try {
    await getDb().execute(sql`select 1`);
    return Response.json({ status: "ok", db: "ok" });
  } catch (err) {
    console.error("Health check: database unreachable", err);
    return Response.json({ status: "error", db: "unreachable" }, { status: 503 });
  }
}
