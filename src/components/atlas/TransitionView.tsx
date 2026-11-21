"use client";

import type { CSSProperties } from "react";
import { Photo } from "@/components/Photo";
import { findStop } from "@/lib/atlas";
import type { AtlasData } from "@/lib/content";
import styles from "./TransitionView.module.css";

const TRACK_W = 1040;
const TRACK_ZOOM = 2.6;
const NODE_Y = [10, -46, 28, -34, 16];
/** Upright phones: the track runs top to bottom, wiggling sideways, this far between stops. */
const STEP_V = 130;
const NODE_X = [-36, 34, -22, 40, -30];
/** Room the section needs besides the track: title, heading and gaps. */
const CHROME_V = 250;

/** How long the zoom (from the map) or pan (between dates) along the track takes. */
export const TRACK_ZOOM_MS = 1400;
export const TRACK_PAN_MS = 1100;
/** How long the paper circle takes to open into the post. */
export const PAPER_MS = 650;

type Props = {
  data: AtlasData;
  stop: { tripSlug: string; stopSlug: string };
  /** The stop being left, when switching dates within a trip: the track starts zoomed on it. */
  fromSlug?: string | null;
  /** 0 title, 1 track, 2 zoomed onto the stop. */
  phase: 0 | 1 | 2;
  /** When the paper circle starts opening, in ms after this view appears. */
  paperDelay: number;
  /** Upright phones get a vertical timeline that fills this window height. */
  vertical: { height: number } | null;
  onSkip: () => void;
};

/** The trip's stops on a timeline, zooming onto the one being opened. Click to skip. */
export function TransitionView({ data, stop, fromSlug, phase, paperDelay, vertical, onSkip }: Props) {
  const found = findStop(data, stop.tripSlug, stop.stopSlug);
  if (!found) return null;
  const { trip, index } = found;
  const fromIndex = fromSlug ? trip.stops.findIndex((s) => s.slug === fromSlug) : -1;
  const panning = fromIndex >= 0;
  const n = trip.stops.length;
  // Node positions are relative to the middle of the stage, where the track is anchored.
  const length = vertical ? STEP_V * Math.max(1, n - 1) : TRACK_W;
  const along = (i: number) => (n > 1 ? (i * length) / (n - 1) - length / 2 : 0);
  const nodes = trip.stops.map((s, i) =>
    vertical
      ? { ...s, x: NODE_X[i % NODE_X.length], y: along(i) }
      : { ...s, x: along(i), y: NODE_Y[i % NODE_Y.length] },
  );
  const active = nodes[index];
  const stageHeight = vertical ? Math.max(260, vertical.height - CHROME_V) : undefined;
  // Unzoomed, the whole track fits the stage: by height on upright phones, by width (--fit) otherwise.
  const fit = stageHeight ? `${Math.min(1, stageHeight / (length + 110)).toFixed(3)}` : "var(--fit)";
  // The node the track is centred on right now, if zoomed in. Centring it both ways keeps
  // the enlarged polaroid clear of the trip title above and the heading below.
  const focus = phase >= 2 ? index : panning ? fromIndex : -1;
  const track =
    focus >= 0
      ? `translate(${(-nodes[focus].x * TRACK_ZOOM).toFixed(1)}px, ${(-nodes[focus].y * TRACK_ZOOM).toFixed(1)}px) scale(${TRACK_ZOOM})`
      : `translate(0px, 0px) scale(${fit})`;
  const [ext, side] = [length / 2 + 140, vertical ? 110 : 80];
  const box = vertical ? [-side, -ext, 2 * side, 2 * ext] : [-ext, -side, 2 * ext, 2 * side];

  return (
    <section
      className={styles.section}
      data-screen-label="Timeline transition"
      onClick={onSkip}
      aria-label={`Opening ${active.name}`}
      style={{ "--paper-delay": `${paperDelay}ms`, "--paper-ms": `${PAPER_MS}ms` } as CSSProperties}
    >
      <div className={styles.titleRow}>
        <span className={styles.title}>{trip.title}</span>
      </div>

      <div className={styles.stage} style={stageHeight ? { height: stageHeight } : undefined}>
        {phase >= 1 && (
          <div
            className={styles.track}
            style={{
              transform: track,
              transitionDuration: `${panning ? TRACK_PAN_MS : TRACK_ZOOM_MS}ms`,
              // Switching dates starts already zoomed in, so skip the fade-in.
              animation: panning ? "none" : undefined,
            }}
          >
            <svg
              viewBox={box.join(" ")}
              width={box[2]}
              height={box[3]}
              className={styles.trackLine}
              style={{ left: box[0], top: box[1] }}
            >
              <path
                d={trackPath(nodes, !!vertical)}
                fill="none"
                stroke="#fffaf0"
                strokeWidth="4"
                strokeDasharray="0 10"
                strokeLinecap="round"
              />
            </svg>
            {nodes.map((node, i) => (
              <div
                key={node.slug}
                className={styles.node}
                style={{ left: node.x, top: node.y, opacity: focus >= 0 && i !== focus ? 0.22 : 1 }}
              >
                <div className={styles.nodeCard}>
                  <Photo photo={node.photo} caption={false} stripe={4} style={{ height: 56, padding: 0 }} />
                  <div className={styles.nodeDate}>{node.date}</div>
                </div>
                {/* Zoomed in, the name would run into the heading below, which repeats it. */}
                <span
                  className={vertical ? (node.x < 0 ? styles.nodeNameLeft : styles.nodeNameRight) : styles.nodeName}
                  style={{ opacity: focus >= 0 ? 0 : 1 }}
                >
                  {node.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.footer}>
        {phase >= 2 && (
          <div key={active.slug} className={styles.heading} style={{ animationDelay: panning ? "0.35s" : undefined }}>
            <span className={styles.kicker}>
              {active.name}, stop {index + 1} of {n}
              {active.dateLong && `, ${active.dateLong}`}
            </span>
            <span className={styles.stopTitle}>{active.title || active.name}</span>
          </div>
        )}
      </div>

      <div className={styles.paper} />
    </section>
  );
}

/** Wavy line through the nodes, running off both ends of the track. */
function trackPath(nodes: { x: number; y: number }[], vertical: boolean): string {
  // Built as if horizontal (u along the track, v across it), then flipped for vertical.
  const pts = nodes.map((p) => (vertical ? { u: p.y, v: p.x } : { u: p.x, v: p.y }));
  const pt = (u: number, v: number) => (vertical ? `${v},${u}` : `${u},${v}`);
  const first = pts[0];
  const last = pts[pts.length - 1];
  let d = `M${pt(first.u - 120, first.v)} C${pt(first.u - 60, first.v)} ${pt(first.u - 40, first.v)} ${pt(first.u, first.v)}`;
  for (let i = 1; i < pts.length; i++) {
    const [a, b] = [pts[i - 1], pts[i]];
    const c = (b.u - a.u) * 0.346;
    d += ` C${pt(a.u + c, a.v)} ${pt(b.u - c, b.v)} ${pt(b.u, b.v)}`;
  }
  return `${d} C${pt(last.u + 60, last.v)} ${pt(last.u + 90, last.v)} ${pt(last.u + 120, last.v)}`;
}
