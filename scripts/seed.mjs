// Loads the sample trips from the original design (scripts/seed-data.json).
// Does nothing if trips already exist, unless run with --reset, which deletes
// all trips and stops first.
import { readFile } from "node:fs/promises";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const reset = process.argv.includes("--reset");
const { trips } = JSON.parse(
  await readFile(new URL("./seed-data.json", import.meta.url), "utf8"),
);
const sql = postgres(url, { max: 1, onnotice: () => {} });

try {
  await sql.begin(async (tx) => {
    if (reset) {
      await tx`delete from trips`;
    } else {
      const [{ count }] = await tx`select count(*)::int as count from trips`;
      if (count > 0) {
        console.log(`Skipped: ${count} trips already exist (use --reset to replace them)`);
        return;
      }
    }

    for (const t of trips) {
      const [{ id }] = await tx`
        insert into trips (slug, title, state_id, start_date, end_date, color_index, cover_photo, home_slot, published)
        values (${t.slug}, ${t.title}, ${t.stateId}, ${t.startDate}, ${t.endDate}, ${t.colorIndex},
                ${t.coverPhoto ? tx.json(t.coverPhoto) : null}, ${t.homeSlot ?? null}, true)
        returning id`;
      for (const [position, s] of t.stops.entries()) {
        await tx`
          insert into stops (trip_id, position, slug, name, place_key, start_date, end_date, nights,
                             title, dek, quote, photos, details, story, see, eat, home_slot, published)
          values (${id}, ${position}, ${s.slug}, ${s.name}, ${s.placeKey ?? null}, ${s.startDate ?? null},
                  ${s.endDate ?? null}, ${s.nights ?? null}, ${s.title ?? ""}, ${s.dek ?? ""}, ${s.quote ?? ""},
                  ${tx.json(s.photos ?? [])}, ${tx.json(s.details ?? [])}, ${tx.json(s.story ?? [])},
                  ${tx.json(s.see ?? [])}, ${tx.json(s.eat ?? [])}, ${s.homeSlot ?? null}, true)`;
      }
    }
    const stopCount = trips.reduce((n, t) => n + t.stops.length, 0);
    console.log(`Seeded ${trips.length} trips and ${stopCount} stops`);
  });
} catch (err) {
  console.error("Seeding failed:", err);
  process.exitCode = 1;
} finally {
  await sql.end();
}
