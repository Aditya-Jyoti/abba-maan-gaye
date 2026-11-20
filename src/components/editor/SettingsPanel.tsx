"use client";

import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import { logout } from "@/lib/auth/actions";
import type { Viewer } from "@/lib/auth/session";
import {
  createStop,
  deleteStop,
  deleteTrip,
  moveStop,
  setTripPublished,
  unpublishStop,
  updateStopSettings,
  updateTripSettings,
  type Failure,
} from "@/lib/cms/actions";
import { slugify } from "@/lib/cms/content";
import type { EditorStop, StopSettings, TripSettings } from "@/lib/cms/queries";
import { map, TRIP_COLORS } from "@/lib/map";
import { stopEditHref } from "@/lib/routes";
import { Drawer } from "./Drawer";
import styles from "./editor.module.css";
import { PinPicker } from "./PinPicker";

type Props = {
  data: EditorStop;
  published: boolean;
  viewer: Viewer;
  flush: () => Promise<boolean>;
  onClose: () => void;
  notify: (text: string, error?: boolean) => void;
  onUnpublished: () => void;
};

const STATES = [...map.states].sort((a, b) => a.name.localeCompare(b.name));

const message = (res: Failure | { status: "ok" } | undefined) =>
  !res || res.status === "ok"
    ? null
    : res.status === "error"
      ? res.message
      : res.status === "signed-out"
        ? "Your session has ended. Log in again first."
        : "Someone else changed this. Reload the page.";

/** Stop and trip details that aren't part of the post text: names, URLs, dates, map pins, order. */
export function SettingsPanel({ data, published, viewer, flush, onClose, notify, onUnpublished }: Props) {
  const [stop, setStop] = useState<StopSettings>(data.settings);
  const [trip, setTrip] = useState<TripSettings>(data.trip);
  const [stopError, setStopError] = useState<string | null>(null);
  const [tripError, setTripError] = useState<string | null>(null);
  const [newStop, setNewStop] = useState("");
  const [busy, start] = useTransition();

  // Saving can move to another URL, which would drop unsaved post edits.
  const safely = (fn: () => Promise<string | null | void>, onError?: (m: string | null) => void) =>
    start(async () => {
      if (!(await flush())) {
        notify("Your post edits haven't been saved yet, so nothing was changed.", true);
        return;
      }
      const err = (await fn()) ?? null;
      onError?.(err);
      if (err && !onError) notify(err, true);
    });

  const saveStop = () =>
    safely(async () => {
      const err = message(await updateStopSettings({ stopId: data.stopId, settings: stop }));
      if (!err) notify("Stop details saved.");
      return err;
    }, setStopError);

  const saveTrip = () =>
    safely(async () => {
      const err = message(await updateTripSettings({ tripId: data.tripId, settings: trip, stopSlug: data.settings.slug }));
      if (!err) notify("Trip details saved.");
      return err;
    }, setTripError);

  const stopChanged = JSON.stringify(stop) !== JSON.stringify(data.settings);
  const tripChanged = JSON.stringify(trip) !== JSON.stringify(data.trip);
  const others = data.tripStops.filter((s) => s.id !== data.stopId).map((s) => ({ name: s.name, pin: s.pin }));

  return (
    <Drawer title="Settings" onClose={onClose}>
      <form
        className={styles.panelSection}
        onSubmit={(e) => {
          e.preventDefault();
          saveStop();
        }}
      >
        <h3 className={styles.panelHeading}>This stop</h3>
        <Field label="Name">
          <input className={styles.input} value={stop.name} onChange={(e) => setStop({ ...stop, name: e.target.value })} required maxLength={120} />
        </Field>
        <Field label="Web address" group hint={`/trips/${data.trip.slug}/${stop.slug || "..."}`}>
          <div className={styles.inputRow}>
            <input
              className={styles.input}
              value={stop.slug}
              aria-label="Stop web address"
              onChange={(e) => setStop({ ...stop, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
              required
              maxLength={60}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
            />
            <button type="button" className={styles.chipQuiet} onClick={() => setStop({ ...stop, slug: slugify(stop.name) })}>
              From name
            </button>
          </div>
        </Field>
        <div className={styles.fieldPair}>
          <Field label="Arrived">
            <input type="date" className={styles.input} value={stop.startDate ?? ""} onChange={(e) => setStop({ ...stop, startDate: e.target.value || null })} />
          </Field>
          <Field label="Left">
            <input type="date" className={styles.input} value={stop.endDate ?? ""} min={stop.startDate ?? undefined} onChange={(e) => setStop({ ...stop, endDate: e.target.value || null })} />
          </Field>
        </div>
        <div className={styles.fieldPair}>
          <Field label="Nights">
            <input
              type="number"
              className={styles.input}
              min={0}
              max={365}
              value={stop.nights ?? ""}
              onChange={(e) => setStop({ ...stop, nights: e.target.value === "" ? null : Math.max(0, Math.round(Number(e.target.value))) })}
            />
          </Field>
          <Field label="Home page card">
            <SlotSelect value={stop.homeSlot} onChange={(homeSlot) => setStop({ ...stop, homeSlot })} />
          </Field>
        </div>
        <Field label="Pin on the map" group>
          <PinPicker stateId={data.trip.stateId} value={stop.pin} onChange={(pin) => setStop({ ...stop, pin })} others={others} />
        </Field>
        {stopError && <p className={styles.formError}>{stopError}</p>}
        <button type="submit" className={styles.primary} disabled={busy || !stopChanged}>
          Save stop details
        </button>
        <p className={styles.panelText}>These go live as soon as they&apos;re saved. The post itself waits for Publish.</p>
      </form>

      <section className={styles.panelSection}>
        <h3 className={styles.panelHeading}>Stops on this trip</h3>
        <ol className={styles.stopList}>
          {data.tripStops.map((s, i) => (
            <li key={s.id} className={s.id === data.stopId ? styles.stopCurrent : styles.stopItem}>
              <Link href={s.href} className={styles.stopLink} aria-current={s.id === data.stopId ? "page" : undefined} onClick={onClose}>
                {i + 1}. {s.name}
              </Link>
              <span className={styles.badges}>
                {!s.published && <span className={styles.badge}>Hidden</span>}
                {s.hasDraft && <span className={styles.badgeDraft}>Draft</span>}
                {!s.pin && <span className={styles.badge}>No pin</span>}
              </span>
              <span className={styles.stopMove}>
                <button type="button" className={styles.tool} disabled={busy || i === 0} onClick={() => safely(async () => message(await moveStop({ stopId: s.id, by: -1 })))} aria-label={`Move ${s.name} earlier`}>
                  {"\u2191"}
                </button>
                <button
                  type="button"
                  className={styles.tool}
                  disabled={busy || i === data.tripStops.length - 1}
                  onClick={() => safely(async () => message(await moveStop({ stopId: s.id, by: 1 })))}
                  aria-label={`Move ${s.name} later`}
                >
                  {"\u2193"}
                </button>
              </span>
            </li>
          ))}
        </ol>
        <form
          className={styles.inputRow}
          onSubmit={(e) => {
            e.preventDefault();
            if (newStop.trim()) safely(async () => message(await createStop({ tripId: data.tripId, name: newStop })));
          }}
        >
          <input className={styles.input} placeholder="Next stop, e.g. Kasol" value={newStop} onChange={(e) => setNewStop(e.target.value)} maxLength={120} aria-label="New stop name" />
          <button type="submit" className={styles.chip} disabled={busy || !newStop.trim()}>
            Add stop
          </button>
        </form>
      </section>

      <form
        className={styles.panelSection}
        onSubmit={(e) => {
          e.preventDefault();
          saveTrip();
        }}
      >
        <h3 className={styles.panelHeading}>The trip</h3>
        <Field label="Title">
          <input className={styles.input} value={trip.title} onChange={(e) => setTrip({ ...trip, title: e.target.value })} required maxLength={120} />
        </Field>
        <Field label="Web address" hint={`/trips/${trip.slug || "..."}/${data.settings.slug}`}>
          <input
            className={styles.input}
            value={trip.slug}
            onChange={(e) => setTrip({ ...trip, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
            required
            maxLength={60}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
          />
        </Field>
        <Field label="State" hint={trip.stateId !== data.trip.stateId ? "Changing the state removes every stop's map pin." : undefined}>
          <select className={styles.input} value={trip.stateId} onChange={(e) => setTrip({ ...trip, stateId: e.target.value })}>
            {STATES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <div className={styles.fieldPair}>
          <Field label="Started">
            <input type="date" className={styles.input} value={trip.startDate ?? ""} onChange={(e) => setTrip({ ...trip, startDate: e.target.value || null })} />
          </Field>
          <Field label="Ended">
            <input type="date" className={styles.input} value={trip.endDate ?? ""} min={trip.startDate ?? undefined} onChange={(e) => setTrip({ ...trip, endDate: e.target.value || null })} />
          </Field>
        </div>
        <div className={styles.fieldPair}>
          <Field label="Route colour" group>
            <div className={styles.swatches} role="radiogroup" aria-label="Route colour">
              {TRIP_COLORS.map((c, i) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={trip.colorIndex === i}
                  aria-label={`Colour ${i + 1}`}
                  className={styles.swatch}
                  style={{ background: c }}
                  onClick={() => setTrip({ ...trip, colorIndex: i })}
                />
              ))}
            </div>
          </Field>
          <Field label="Home page card">
            <SlotSelect value={trip.homeSlot} onChange={(homeSlot) => setTrip({ ...trip, homeSlot })} />
          </Field>
        </div>
        {tripError && <p className={styles.formError}>{tripError}</p>}
        <button type="submit" className={styles.primary} disabled={busy || !tripChanged}>
          Save trip details
        </button>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={data.tripPublished}
            disabled={busy}
            onChange={(e) => {
              const show = e.target.checked;
              safely(async () => {
                const err = message(await setTripPublished({ tripId: data.tripId, published: show }));
                if (!err) notify(show ? "The trip is on the map." : "The trip is hidden from the site.");
                return err;
              });
            }}
          />
          Show this trip on the site
        </label>
        <p className={styles.panelText}>Only its published stops are shown. Publishing a stop shows its trip too.</p>
      </form>

      <section className={styles.panelSection}>
        <h3 className={styles.panelHeading}>Remove</h3>
        <div className={styles.dangerRow}>
          {published && (
            <button
              type="button"
              className={styles.chipQuiet}
              disabled={busy}
              onClick={() =>
                safely(async () => {
                  const err = message(await unpublishStop({ stopId: data.stopId }));
                  if (!err) {
                    onUnpublished();
                    notify("This stop is hidden from the site. Its post and history are kept.");
                  }
                  return err;
                })
              }
            >
              Unpublish this stop
            </button>
          )}
          <button
            type="button"
            className={styles.chipDanger}
            disabled={busy}
            onClick={() => {
              if (confirm(`Delete ${data.settings.name} with its post and history? This can't be undone.`)) {
                safely(async () => message(await deleteStop({ stopId: data.stopId })));
              }
            }}
          >
            Delete this stop
          </button>
          <button
            type="button"
            className={styles.chipDanger}
            disabled={busy}
            onClick={() => {
              const typed = prompt(`This deletes "${data.trip.title}" and all ${data.tripStops.length} of its stops for good. Type the trip's title to confirm.`);
              if (typed?.trim() === data.trip.title) safely(async () => message(await deleteTrip({ tripId: data.tripId })));
              else if (typed !== null) notify("The title didn't match, so nothing was deleted.", true);
            }}
          >
            Delete the whole trip
          </button>
        </div>
      </section>

      <form action={logout} className={styles.signedIn}>
        <input type="hidden" name="next" value={stopEditHref(data.trip.slug, data.settings.slug)} />
        <span>
          Signed in as <strong>{viewer.name}</strong>
        </span>
        <button type="submit" className={styles.chipQuiet}>
          Log out
        </button>
      </form>
    </Drawer>
  );
}

type FieldProps = {
  label: string;
  hint?: string;
  /** For several controls (or a map) rather than one input: a click on a <label> would activate its first button. */
  group?: boolean;
  children: ReactNode;
};

function Field({ label, hint, group, children }: FieldProps) {
  const Tag = group ? "div" : "label";
  return (
    <Tag className={styles.field} role={group ? "group" : undefined} aria-label={group ? label : undefined}>
      <span className={styles.fieldLabel}>{label}</span>
      {children}
      {hint && <span className={styles.fieldHint}>{hint}</span>}
    </Tag>
  );
}

function SlotSelect({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <select className={styles.input} value={value ?? ""} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}>
      <option value="">Not shown</option>
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <option key={n} value={n}>
          Card {n}
        </option>
      ))}
    </select>
  );
}
