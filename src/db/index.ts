import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Database = PostgresJsDatabase<typeof schema>;

// Reuse one pool across hot reloads in development.
const globalForDb = globalThis as unknown as { db?: Database };

// Created on first use so `next build` doesn't need a DATABASE_URL.
export function getDb(): Database {
  if (globalForDb.db) return globalForDb.db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const db = drizzle(postgres(url, { max: 10 }), { schema });
  globalForDb.db = db;
  return db;
}
