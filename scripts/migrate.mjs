// Applies the SQL migrations in ./drizzle. Runs in the `migrate` container
// before the app starts, using only production dependencies.
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const client = postgres(url, { max: 1, onnotice: () => {} });
try {
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  console.log("Migrations applied");
} catch (err) {
  console.error("Migration failed:", err);
  process.exitCode = 1;
} finally {
  await client.end();
}
