"use client";

import { useRef, type MouseEvent } from "react";
import { map, stateById, stateFill, stateSide, type Point } from "@/lib/map";
import styles from "./editor.module.css";

type Props = {
  stateId: string;
  value: Point | null;
  onChange: (p: Point | null) => void;
  /** The trip's other stops, drawn for reference. */
  others: { name: string; pin: Point | null }[];
};

/** A map of the trip's state: click to drop this stop's pin. */
export function PinPicker({ stateId, value, onChange, others }: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const state = stateById.get(stateId);
  if (!state) return <p className={styles.panelText}>Pick the trip&apos;s state first.</p>;

  const [[x0, y0], [x1, y1]] = state.bb;
  const pad = Math.max(x1 - x0, y1 - y0) * 0.08;
  const box = [x0 - pad, y0 - pad, x1 - x0 + pad * 2, y1 - y0 + pad * 2];
  const r = Math.max(box[2], box[3]) / 70;

  const place = (e: MouseEvent<SVGSVGElement>) => {
    const ctm = svg.current?.getScreenCTM();
    if (!ctm) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const round = (n: number) => Math.round(n * 100) / 100;
    onChange([round(Math.min(map.w, Math.max(0, p.x))), round(Math.min(map.h, Math.max(0, p.y)))]);
  };

  const named = Object.entries(map.places).filter(([, [x, y]]) => x >= box[0] && x <= box[0] + box[2] && y >= box[1] && y <= box[1] + box[3]);

  return (
    <div className={styles.pinPicker}>
      <svg
        ref={svg}
        viewBox={box.join(" ")}
        className={styles.pinMap}
        onClick={place}
        role="img"
        aria-label={`Map of ${state.name}. Click to place the pin.`}
      >
        <path d={state.d} fill={stateFill(state.hue)} stroke={stateSide(state.hue)} strokeWidth={r / 3} />
        {named.map(([key, [x, y]]) => (
          <g key={key} className={styles.pinPlace}>
            <circle cx={x} cy={y} r={r / 2.5} />
            <text x={x + r * 0.7} y={y + r / 3} fontSize={r * 1.3}>
              {key[0].toUpperCase() + key.slice(1)}
            </text>
          </g>
        ))}
        {others.map(
          (o) =>
            o.pin && (
              <g key={o.name} className={styles.pinOther}>
                <circle cx={o.pin[0]} cy={o.pin[1]} r={r / 1.6} />
                <text x={o.pin[0] + r * 0.8} y={o.pin[1] + r / 3} fontSize={r * 1.2}>
                  {o.name}
                </text>
              </g>
            ),
        )}
        {value && (
          <g className={styles.pinMine}>
            <circle cx={value[0]} cy={value[1]} r={r} />
            <circle cx={value[0]} cy={value[1]} r={r / 2.6} fill="#fffdf7" />
          </g>
        )}
      </svg>
      <div className={styles.pinRow}>
        <span className={styles.panelText}>{value ? "Click elsewhere to move the pin." : "No pin yet: this stop won't show on the map. Click to place it."}</span>
        {value && (
          <button type="button" className={styles.chipQuiet} onClick={() => onChange(null)}>
            Remove pin
          </button>
        )}
      </div>
    </div>
  );
}
