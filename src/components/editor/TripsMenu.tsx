"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { logout } from "@/lib/auth/actions";
import type { Viewer } from "@/lib/auth/session";
import { createTrip } from "@/lib/cms/actions";
import type { EditorIndexTrip } from "@/lib/cms/queries";
import { map } from "@/lib/map";
import { parseRoute } from "@/lib/routes";
import { Drawer } from "./Drawer";
import styles from "./editor.module.css";

const STATES = [...map.states].sort((a, b) => a.name.localeCompare(b.name));

/** On the map pages, signed-in editors get a list of every trip and a way to start a new one. */
export function TripsMenu({ trips, viewer }: { trips: EditorIndexTrip[]; viewer: Viewer }) {
  const route = parseRoute(usePathname());
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(trips.length === 0);
  const [form, setForm] = useState({ title: "", stateId: route.kind === "state" ? route.stateId : "", startDate: "", stopName: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();

  if (route.kind !== "india" && route.kind !== "state") return null;

  const submit = () =>
    start(async () => {
      setError(null);
      const res = await createTrip(form);
      // On success the action opens the new stop in the editor.
      if (res?.status === "error") setError(res.message);
      else if (res?.status === "signed-out") setError("Your session has ended. Log in again first.");
    });

  return (
    <>
      <div className={styles.mapBar} role="region" aria-label="Editor">
        <button type="button" className={styles.publish} onClick={() => setOpen(true)} aria-expanded={open}>
          Edit trips
        </button>
        <span className={styles.who} title={viewer.email}>
          {viewer.name}
        </span>
        <form action={logout}>
          <input type="hidden" name="next" value="/" />
          <button type="submit" className={styles.barButton}>
            Log out
          </button>
        </form>
      </div>

      {open && (
        <Drawer title="Trips" onClose={() => setOpen(false)}>
          <section className={styles.panelSection}>
            {creating ? (
              <form
                className={styles.panelForm}
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
              >
                <h3 className={styles.panelHeading}>New trip</h3>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Title</span>
                  <input
                    className={styles.input}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Snow in Spiti"
                    required
                    maxLength={120}
                    autoFocus
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>State</span>
                  <select className={styles.input} value={form.stateId} onChange={(e) => setForm({ ...form, stateId: e.target.value })} required>
                    <option value="" disabled>
                      Choose a state
                    </option>
                    {STATES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Started</span>
                  <input type="date" className={styles.input} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>First stop</span>
                  <input
                    className={styles.input}
                    value={form.stopName}
                    onChange={(e) => setForm({ ...form, stopName: e.target.value })}
                    placeholder="Kaza"
                    required
                    maxLength={120}
                  />
                </label>
                {error && <p className={styles.formError}>{error}</p>}
                <div className={styles.inputRow}>
                  <button type="submit" className={styles.primary} disabled={busy}>
                    {busy ? "Creating..." : "Create and start writing"}
                  </button>
                  {trips.length > 0 && (
                    <button type="button" className={styles.chipQuiet} onClick={() => setCreating(false)}>
                      Cancel
                    </button>
                  )}
                </div>
                <p className={styles.panelText}>The trip stays hidden until you publish one of its stops.</p>
              </form>
            ) : (
              <button type="button" className={styles.primary} onClick={() => setCreating(true)}>
                + New trip
              </button>
            )}
          </section>

          {trips.map((t) => (
            <section key={t.id} className={styles.panelSection}>
              <h3 className={styles.tripHeading}>
                {t.title}
                {!t.published && <span className={styles.badge}>Hidden</span>}
              </h3>
              <span className={styles.fieldHint}>{t.stateName}</span>
              <ol className={styles.stopList}>
                {t.stops.map((s, i) => (
                  <li key={s.slug} className={styles.stopItem}>
                    <Link href={s.href} className={styles.stopLink}>
                      {i + 1}. {s.name}
                    </Link>
                    <span className={styles.badges}>
                      {!s.published && <span className={styles.badge}>Hidden</span>}
                      {s.hasDraft && <span className={styles.badgeDraft}>Draft</span>}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </Drawer>
      )}
    </>
  );
}
