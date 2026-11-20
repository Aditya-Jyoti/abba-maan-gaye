"use client";

import type { CSSProperties } from "react";
import { Photo } from "@/components/Photo";
import { findStop } from "@/lib/atlas";
import type { AtlasData } from "@/lib/content";
import styles from "./TransitionView.module.css";

const TRACK_W = 1040;
const TRACK_ZOOM = 2.6;
const NODE_Y = [10, -46, 28, -34, 16];

type Props = {
  data: AtlasData;
  stop: { tripSlug: string; stopSlug: string };
  phase: 0 | 1 | 2;
  onSkip: () => void;
};

/** The trip's stops on a timeline, zooming onto the one being opened. Click to skip. */
export function TransitionView({ data, stop, phase, onSkip }: Props) {
  const found = findStop(data, stop.tripSlug, stop.stopSlug);
  if (!found) return null;
  const { trip, index } = found;
  const n = trip.stops.length;
  const nodes = trip.stops.map((s, i) => ({
    ...s,
    x: n > 1 ? (i * TRACK_W) / (n - 1) : TRACK_W / 2,
    y: NODE_Y[i % NODE_Y.length],
  }));
  const active = nodes[index];
  const track =
    phase >= 2
      ? `translateX(${(TRACK_W / 2 - active.x * TRACK_ZOOM).toFixed(1)}px) scale(${TRACK_ZOOM})`
      : "translateX(0px) scale(1)";

  return (
    <section
      className={styles.section}
      data-screen-label="Timeline transition"
      onClick={onSkip}
      aria-label={`Opening ${active.name}`}
    >
      <div className={styles.titleRow}>
        <span className={styles.title}>{trip.title}</span>
      </div>

      <div className={styles.stage}>
        {phase >= 1 && (
          <div className={styles.track} style={{ transform: track }}>
            <svg viewBox="-120 -80 1280 160" width="1280" height="160" className={styles.trackLine}>
              <path d={trackPath(nodes)} fill="none" stroke="#fffaf0" strokeWidth="4" strokeDasharray="0 10" strokeLinecap="round" />
            </svg>
            {nodes.map((node, i) => (
              <div
                key={node.slug}
                className={styles.node}
                style={{ left: node.x, top: node.y, opacity: phase >= 2 && i !== index ? 0.22 : 1 } as CSSProperties}
              >
                <div className={styles.nodeCard}>
                  <Photo photo={node.photo} caption={false} stripe={4} style={{ height: 56, padding: 0 }} />
                  <div className={styles.nodeDate}>{node.date}</div>
                </div>
                <span className={styles.nodeName}>{node.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.footer}>
        {phase >= 2 && (
          <div className={styles.heading}>
            <span className={styles.kicker}>
              Stop {index + 1} of {n}
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

/** Wavy line through the nodes, running off both edges of the track. */
function trackPath(nodes: { x: number; y: number }[]): string {
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  let d = `M-120,${first.y} C-60,${first.y} -40,${first.y} ${first.x},${first.y}`;
  for (let i = 1; i < nodes.length; i++) {
    const [a, b] = [nodes[i - 1], nodes[i]];
    const c = (b.x - a.x) * 0.346;
    d += ` C${a.x + c},${a.y} ${b.x - c},${b.y} ${b.x},${b.y}`;
  }
  return `${d} C${last.x + 60},${last.y} ${last.x + 90},${last.y} ${last.x + 120},${last.y}`;
}
