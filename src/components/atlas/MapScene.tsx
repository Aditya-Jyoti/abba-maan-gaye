"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Photo } from "@/components/Photo";
import { ICONS } from "@/components/map/icons";
import type { AtlasData, AtlasTrip, HomeCard } from "@/lib/content";
import {
  applyZoom,
  calloutPoints,
  curve,
  LIFT,
  map,
  mapDecor,
  pinLabelY,
  type PhoneFrame,
  type Point,
  SEA,
  SOCKET,
  stateById,
  stateCities,
  stateFill,
  stateFillDim,
  stateName,
  stateSide,
  stateSideDim,
  stateZoom,
  type Zoom,
} from "@/lib/map";
import { homeHref, stateHref } from "@/lib/routes";
import type { Scene } from "./Atlas";
import type { Viewport } from "./hooks";
import styles from "./MapScene.module.css";
import { slabAnimation } from "./slab";

type Props = { data: AtlasData; scene: Scene; viewport: Viewport; sea: ReactNode };

export function MapScene({ data, scene, viewport, sea }: Props) {
  const router = useRouter();
  const { mobile, short } = viewport;
  // Phones either way up share the phone map layout (bigger labels, photos in rows or columns).
  const compact = mobile || short;
  const [hover, setHover] = useState<string | null>(null);
  const [picked, setPicked] = useState<{ stateId: string; slug: string } | null>(null);

  const india = scene.view === "india";
  const zoomedId = scene.view === "state" ? scene.stateId : null;

  // The state whose slab has finished flying out. Pins, routes and labels wait for it,
  // so nothing lands on the state while it's still moving.
  const [settledId, setSettledId] = useState<string | null>(null);
  if (settledId && settledId !== zoomedId) setSettledId(null);
  const settled = !!zoomedId && settledId === zoomedId;
  const decor = useMemo(() => mapDecor(compact), [compact]);
  const visited = useMemo(() => new Map(data.visited.map((v) => [v.stateId, v])), [data.visited]);
  const allDistricts = useMemo(() => Object.values(data.districts).join(""), [data.districts]);

  const stateTrips = zoomedId ? data.trips.filter((t) => t.stateId === zoomedId) : [];
  const primary =
    stateTrips.find((t) => picked?.stateId === zoomedId && t.slug === picked.slug) ?? stateTrips[0] ?? null;
  const others = stateTrips.filter((t) => t !== primary);
  const trips = stateTrips.length;
  const phone = useMemo(() => (compact ? phoneFrame(viewport, trips) : undefined), [compact, viewport, trips]);
  const zoom = useMemo(() => (zoomedId ? stateZoom(zoomedId, compact, phone) : null), [zoomedId, compact, phone]);

  const activeHover = india ? hover : null;
  const hovered = activeHover ? stateById.get(activeHover) : undefined;
  const lift = (id: string) => (id === activeHover ? -LIFT : 0);
  const sunk = !!zoomedId && !scene.leaving;
  const open = (id: string) => {
    if (india && visited.has(id)) router.push(stateHref(id), { scroll: false });
  };

  const lakshadweep = stateById.get("lakshadweep");
  const indiaStyle: CSSProperties = {
    transform: sunk ? "translate(0px, 30px) scale(0.92)" : "translate(0px, 0px) scale(1)",
    opacity: sunk ? 0.28 : 1,
  };
  const fit = zoomedId ? viewport.fitState : viewport.fitIndia;

  return (
    <div className={styles.frame} data-screen-label="Map">
      <div className={styles.vignette} />
      <div className={styles.border} />
      <div className={styles.borderDashed} />

      <div className={styles.canvas} style={{ transform: `scale(${fit.toFixed(4)})` }}>
        <div className={styles.sea} style={{ opacity: sunk ? 0.55 : 1 }}>
          {sea}
        </div>

        <div className={styles.mapLayer}>
          {/* Transformed as a whole element (not an inner <g>) so it animates on the compositor. */}
          <svg viewBox="0 0 700 800" width="700" height="800" className={`${styles.svg} ${styles.india}`} style={indiaStyle}>
            <g>
              <g className={styles.coast}>
                {(
                  [
                    ["rgba(255,255,255,.42)", 62],
                    [SEA, 58],
                    ["rgba(255,255,255,.5)", 40],
                    [SEA, 36],
                    ["rgba(255,255,255,.6)", 21],
                    [SEA, 17],
                    ["oklch(0.86 0.06 185)", 8],
                  ] as const
                ).map(([stroke, width], i) => (
                  <path key={i} d={map.outline} stroke={stroke} strokeWidth={width} />
                ))}
              </g>

              <g className={styles.landShadow}>
                <g transform="translate(0 4)">
                  {map.states.map((s) => {
                    const dim = !!zoomedId && s.id !== zoomedId;
                    const side = dim ? stateSideDim(s.hue) : stateSide(s.hue);
                    return <path key={s.id} d={s.d} className={styles.side} fill={side} stroke={side} />;
                  })}
                </g>
                {map.lakshadweep.map(([x, y, r], i) => (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={r}
                    fill={lakshadweep ? stateFill(lakshadweep.hue) : "#e9cf9a"}
                    stroke="#fffaf0"
                    strokeWidth=".9"
                  />
                ))}
                {map.states.map((s) => {
                  const v = visited.get(s.id);
                  const fill =
                    s.id === zoomedId && sunk ? SOCKET : zoomedId && s.id !== zoomedId ? stateFillDim(s.hue) : stateFill(s.hue);
                  const clickable = india && !!v;
                  return (
                    <path
                      key={s.id}
                      d={s.d}
                      className={styles.state}
                      fill={fill}
                      style={{ cursor: clickable ? "pointer" : "default" }}
                      onMouseEnter={() => india && setHover(s.id)}
                      onMouseLeave={() => setHover((h) => (h === s.id ? null : h))}
                      onClick={() => open(s.id)}
                      {...(clickable && {
                        role: "link",
                        tabIndex: 0,
                        "aria-label": `${s.name}: ${v.summary}`,
                        onFocus: () => setHover(s.id),
                        onBlur: () => setHover(null),
                        onKeyDown: (e: React.KeyboardEvent) => e.key === "Enter" && open(s.id),
                      })}
                    />
                  );
                })}
                <path d={allDistricts} className={styles.indiaDistricts} />
              </g>

              {hovered && (
                <g className={styles.lifted}>
                  <path
                    d={hovered.d}
                    className={styles.side}
                    fill={stateSide(hovered.hue)}
                    stroke={stateSide(hovered.hue)}
                    transform="translate(0 6)"
                  />
                  <path d={hovered.d} className={styles.liftedTop} fill={stateFill(hovered.hue)} />
                  {data.districts[hovered.id] && <path d={data.districts[hovered.id]} className={styles.indiaDistricts} />}
                </g>
              )}

              {decor.leads.map((l) => (
                <g key={l.stateId} className={styles.rise} style={{ transform: `translateY(${lift(l.stateId)}px)` }}>
                  <line x1={l.cx} y1={l.cy} x2={l.lx} y2={l.ly} stroke="#3d2c22" strokeWidth="1.1" />
                  <circle cx={l.cx} cy={l.cy} r="2.6" fill="#c4532f" stroke="#fffaf0" strokeWidth="1.2" />
                </g>
              ))}

              {decor.icons.map((d, i) => (
                <g key={i} className={styles.rise} style={{ transform: `translateY(${lift(d.stateId)}px)` }}>
                  <g transform={`translate(${d.x},${d.y}) scale(${d.scale})`} className={styles.icon}>
                    {ICONS[d.type]}
                  </g>
                </g>
              ))}
            </g>
          </svg>

          <div className={`${styles.labels} ${styles.india}`} style={indiaStyle}>
            {decor.labels.map((l) => (
              <span
                key={l.stateId}
                className={styles.label}
                style={{
                  left: l.x,
                  top: l.y,
                  fontSize: l.size,
                  transform: `translate(-50%,-50%) translateY(${lift(l.stateId)}px) rotate(${l.angle}deg)`,
                }}
              >
                {l.text}
              </span>
            ))}
            {!compact &&
              decor.leads.map((l) => (
                <span
                  key={l.stateId}
                  className={styles.leadLabel}
                  style={{
                    left: l.lx,
                    top: l.ly,
                    transform: `translate(${l.ax},-50%) translateY(${lift(l.stateId)}px)`,
                  }}
                >
                  {l.text}
                </span>
              ))}
          </div>
        </div>

        {zoomedId && zoom && (
          <StateSlab
            key={zoomedId}
            stateId={zoomedId}
            zoom={zoom}
            leaving={scene.leaving}
            districts={data.districts[zoomedId] ?? ""}
            settled={settled}
            onSettled={() => setSettledId(zoomedId)}
          />
        )}

        {india &&
          data.previews.map((p, i) => (
            <div
              key={i}
              className={styles.preview}
              style={{
                left: p.x,
                top: p.y,
                animationDelay: scene.back ? "0.15s" : "0.5s",
                transform: `translate(-50%,-100%) translateY(${p.stateId === activeHover ? -LIFT - 3 : 0}px) rotate(${p.rotate}deg)`,
              }}
            >
              <div className={styles.previewFrame}>
                <Photo photo={p.photo} caption={false} sizes="60px" style={{ height: 24, padding: 0 }} stripe={4} />
              </div>
              <div className={styles.previewTape} />
            </div>
          ))}

        {hovered && (
          <div className={styles.tooltip} style={{ left: hovered.cx, top: hovered.bb[0][1] - LIFT - 10 }}>
            <span className={styles.tooltipName}>{hovered.name}</span>
            <span className={styles.tooltipSub}>{visited.get(hovered.id)?.summary ?? "Not yet visited"}</span>
          </div>
        )}

        {zoomedId && zoom && primary && settled && (
          <StatePins
            stateId={zoomedId}
            zoom={zoom}
            primary={primary}
            others={others}
            hidden={scene.leaving || scene.opening}
            mobile={compact}
            fit={viewport.fitState}
            phone={phone}
          />
        )}
      </div>

      <HomeOverlay data={data} visible={india} back={scene.back} onHover={(id) => india && setHover(id)} />

      {zoomedId && primary && (
        <StateOverlay
          stateId={zoomedId}
          primary={primary}
          others={others}
          hidden={scene.leaving || scene.opening}
          onPick={(slug) => setPicked({ stateId: zoomedId, slug })}
        />
      )}

      <nav className={styles.srOnly} aria-label="States visited">
        <ul>
          {data.visited.map((v) => (
            <li key={v.stateId}>
              <Link href={stateHref(v.stateId)} scroll={false}>
                {v.name}: {v.summary}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

type SlabProps = {
  stateId: string;
  zoom: Zoom;
  leaving: boolean;
  /** Borders between the state's districts, drawn once it has landed. */
  districts: string;
  settled: boolean;
  onSettled: () => void;
};

/** How far below the top each layer of the slab's edge sits, in screen px. */
const SLAB_DEPTH = [6, 4, 2];

/** The zoomed state, lifted out of the map as a thick slab. */
function StateSlab({ stateId, zoom, leaving, districts, settled, onSettled }: SlabProps) {
  const st = stateById.get(stateId)!;
  const side = stateSide(st.hue);
  const layer = useRef<HTMLDivElement>(null);
  const onSettledRef = useRef(onSettled);
  useLayoutEffect(() => {
    onSettledRef.current = onSettled;
  });

  // Runs before paint, so the first frame already shows the slab at its starting point.
  useLayoutEffect(() => {
    const el = layer.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { keyframes, duration } = slabAnimation(zoom, leaving);
    const anim = el.animate(keyframes, { duration: reduced ? 1 : duration, fill: "both", easing: "linear" });
    if (!leaving) anim.finished.then(() => onSettledRef.current(), () => {});
    return () => anim.cancel();
  }, [zoom, leaving]);

  const clipId = `slab-clip-${stateId}`;
  return (
    <div ref={layer} className={styles.slabLayer}>
      <svg viewBox="0 0 700 800" width="700" height="800" className={styles.slab}>
        <g transform={`translate(${zoom.tx.toFixed(2)} ${zoom.ty.toFixed(2)}) scale(${zoom.k.toFixed(4)})`} className={styles.slabGroup}>
          <clipPath id={clipId}>
            <path d={st.d} />
          </clipPath>
          {SLAB_DEPTH.map((px) => (
            <path
              key={px}
              d={st.d}
              className={styles.side}
              fill={side}
              stroke={side}
              transform={`translate(0 ${(px / zoom.k).toFixed(3)})`}
            />
          ))}
          <path d={st.d} className={styles.slabTop} fill={stateFill(st.hue)} />
          {districts && settled && !leaving && (
            <path d={districts} className={styles.districts} clipPath={`url(#${clipId})`} />
          )}
        </g>
      </svg>
    </div>
  );
}

const PIN_TILT = [-5, 4, -3, 6, -4];

/** On phones, how big the photo callouts are relative to the desktop design. */
const CALLOUT_SIZE = 1.05;
const CALLOUT_SIZE_SIDEWAYS = 0.9;

/**
 * The canvas area a phone has free for a state and its photos. Upright: below the back
 * button and above the trips card (which grows with each trip). On its side: below the
 * back button and left of the trips card, which sits in the bottom-right corner.
 */
function phoneFrame({ fitState: fit, width, height: h, short }: Viewport, trips: number): PhoneFrame {
  const x = (px: number) => 350 + (px - width / 2) / fit;
  if (short) {
    const y = (px: number) => 400 + (px - h / 2) / fit;
    return { area: [x(12), y(64), x(width - 248), y(h - 8)], scale: CALLOUT_SIZE_SIDEWAYS / fit };
  }
  const height = Math.max(h, 680); // .frame's min-height
  const top = 118;
  const bottom = 22 + 150 + 34 * Math.max(0, trips - 1) + 12;
  const y = (px: number) => 400 + (px - height / 2) / fit;
  return { area: [x(12), y(top), x(width - 12), y(height - bottom)], scale: CALLOUT_SIZE / fit };
}

type PinsProps = {
  stateId: string;
  zoom: Zoom;
  primary: AtlasTrip;
  others: AtlasTrip[];
  hidden: boolean;
  mobile: boolean;
  fit: number;
  phone?: PhoneFrame;
};

/** Route lines, stop pins and photo callouts on the state view. */
function StatePins({ stateId, zoom, primary, others, hidden, mobile, fit, phone }: PinsProps) {
  const pinScale = phone ? phone.scale.toFixed(2) : "1";
  const dotScale = mobile ? (0.95 / fit).toFixed(2) : "1";

  const pins = primary.stops.flatMap((s) => {
    const at = s.at && applyZoom(s.at, zoom);
    return at ? [{ stop: s, at }] : [];
  });
  const callouts = calloutPoints(
    stateId,
    pins.map((p) => ({ key: p.stop.placeKey, at: p.at })),
    mobile,
    phone,
  );
  const otherPins = others.map((t) => ({
    trip: t,
    pins: t.stops.flatMap((s) => {
      const at = s.at && applyZoom(s.at, zoom);
      return at ? [{ stop: s, at }] : [];
    }),
  }));
  const cities = stateCities(stateId, zoom, mobile).filter(
    (c) => !labelHits(c, callouts, pins.map((p) => p.at), Number(pinScale), Number(dotScale)),
  );
  // Phones draw everything bigger, so the other trips' names get placed where they fit.
  const otherLabels = mobile
    ? placeLabels(
        otherPins.flatMap((o) => o.pins.map((p) => ({ name: p.stop.name, at: p.at }))),
        [...pins.map((p) => p.at)],
        callouts,
        Number(dotScale),
        Number(pinScale),
      )
    : null;

  return (
    <div className={styles.pins} style={{ opacity: hidden ? 0 : 1, transform: `scale(${hidden ? 0.85 : 1})` }}>
      <div className={styles.cities}>
        {cities.map((c) => (
          <div key={c.key} className={styles.city} style={{ left: c.x, top: c.y, scale: dotScale }}>
            <span className={styles.cityDot} />
            <span
              className={styles.cityName}
              style={{ left: c.left ? -9 : 9, transform: `translate(${c.left ? "-100%" : "0%"},-50%)` }}
            >
              {c.name}
            </span>
          </div>
        ))}
      </div>

      <svg viewBox="0 0 700 800" width="700" height="800" className={styles.routes}>
        {otherPins.map(({ trip, pins: ps }) => {
          const d = curve(ps.map((p) => p.at));
          return (
            <g key={trip.slug}>
              <path d={d} fill="none" stroke="#fffaf0" strokeWidth="8" strokeLinecap="round" />
              <path d={d} fill="none" stroke={trip.color} strokeWidth="4" strokeDasharray="0 9" strokeLinecap="round" />
            </g>
          );
        })}
        {pins.map((p, i) => (
          <line
            key={p.stop.slug}
            x1={p.at[0]}
            y1={p.at[1]}
            x2={callouts[i][0]}
            y2={callouts[i][1]}
            stroke="#3d2c22"
            strokeWidth="1.3"
            strokeDasharray="2 3"
            strokeLinecap="round"
          />
        ))}
        <path d={curve(pins.map((p) => p.at))} fill="none" stroke="#fffaf0" strokeWidth="9" strokeLinecap="round" />
        <path
          d={curve(pins.map((p) => p.at))}
          fill="none"
          stroke={primary.color}
          strokeWidth="5"
          strokeDasharray="0 10"
          strokeLinecap="round"
        />
      </svg>

      {otherPins.flatMap(({ trip, pins: ps }, t) =>
        ps.map(({ stop, at }, j) => {
          const placed = otherLabels?.[otherPins.slice(0, t).reduce((n, o) => n + o.pins.length, 0) + j];
          const body = (
            <>
              <span className={styles.otherRing} style={{ borderColor: trip.color }} />
              <span className={styles.otherDot} style={{ background: trip.color }} />
              <span
                className={styles.otherName}
                style={placed ? { left: placed[0], top: placed[1], transform: "none" } : { top: pinLabelY(stateId, stop.placeKey) }}
              >
                {stop.name}
              </span>
            </>
          );
          const style = { left: at[0], top: at[1], scale: dotScale };
          return stop.hasStory ? (
            <Link key={`${trip.slug}/${stop.slug}`} href={stop.href} scroll={false} className={styles.otherPin} style={style}>
              {body}
            </Link>
          ) : (
            <div key={`${trip.slug}/${stop.slug}`} className={styles.otherPin} style={style}>
              {body}
            </div>
          );
        }),
      )}

      {pins.map(({ stop }, i) => (
        <Link
          key={stop.slug}
          href={stop.href}
          scroll={false}
          className={styles.callout}
          style={
            {
              left: callouts[i][0],
              top: callouts[i][1],
              scale: pinScale,
              animationDelay: `${150 + i * 90}ms`,
              "--tilt": `${PIN_TILT[i % PIN_TILT.length]}deg`,
            } as CSSProperties
          }
        >
          <div className={styles.calloutCard}>
            <Photo photo={stop.photo} style={{ height: 52, padding: 0 }} stripe={4} caption={false} />
            <div className={styles.calloutText}>
              <span className={styles.calloutName}>
                <span style={{ color: "#c4532f" }}>{i + 1} </span>
                {stop.name}
              </span>
              <span className={styles.calloutDate}>{stop.date}</span>
            </div>
            <div className={styles.calloutTape} />
          </div>
        </Link>
      ))}

      {pins.map(({ stop, at }, i) => (
        <Link
          key={stop.slug}
          href={stop.href}
          scroll={false}
          tabIndex={-1}
          aria-hidden
          className={styles.pin}
          style={{ left: at[0], top: at[1], scale: dotScale, animationDelay: `${i * 90}ms` }}
        >
          <span className={styles.pinPulse} style={{ borderColor: primary.color }} />
          <span className={styles.pinRing} style={{ borderColor: primary.color }} />
          <span className={styles.pinDot} style={{ background: primary.color }} />
        </Link>
      ))}
    </div>
  );
}

type Box = [number, number, number, number];
const overlaps = (a: Box, b: Box) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];

/** Whether a reference city's dot or name would sit under a stop's polaroid or pin. */
function labelHits(
  c: { name: string; x: number; y: number; left: boolean },
  callouts: Point[],
  pins: Point[],
  pinScale: number,
  dotScale: number,
): boolean {
  // Name is 12px Baloo: about 6.6px a letter, 9px from the dot.
  const w = (c.name.length * 6.6 + 14) * dotScale;
  const h = 9 * dotScale;
  const label: Box = c.left ? [c.x - w, c.y - h, c.x + 5, c.y + h] : [c.x - 5, c.y - h, c.x + w, c.y + h];
  const cards = callouts.map(([x, y]): Box => [x - 50 * pinScale, y - 52 * pinScale, x + 50 * pinScale, y + 50 * pinScale]);
  const dots = pins.map(([x, y]): Box => [x - 16 * dotScale, y - 16 * dotScale, x + 16 * dotScale, y + 16 * dotScale]);
  return [...cards, ...dots].some((b) => overlaps(label, b));
}

/** Size of a secondary-trip pin label (13px Baloo with padding), in its pin's px. */
const otherLabelSize = (name: string): [number, number] => [name.length * 7.4 + 12, 18];

/**
 * Where each secondary-trip pin's name goes, relative to its pin (top-left corner, in the
 * pin's own px): right of the pin if there's room, else left, below or above, avoiding the
 * other pins, the photos and the names already placed.
 */
function placeLabels(
  labels: { name: string; at: Point }[],
  pins: Point[],
  callouts: Point[],
  dotScale: number,
  pinScale: number,
): Point[] {
  const ring = 14 * dotScale;
  const taken: Box[] = [
    ...[...pins, ...labels.map((l) => l.at)].map(([x, y]): Box => [x - ring, y - ring, x + ring, y + ring]),
    ...callouts.map(([x, y]): Box => [x - 46 * pinScale, y - 50 * pinScale, x + 46 * pinScale, y + 50 * pinScale]),
  ];
  return labels.map(({ name, at }) => {
    const [w, h] = otherLabelSize(name);
    const options: Point[] = [
      [15, -h / 2],
      [-15 - w, -h / 2],
      [-w / 2, 14],
      [-w / 2, -14 - h],
    ];
    const boxOf = ([dx, dy]: Point): Box => [
      at[0] + dx * dotScale,
      at[1] + dy * dotScale,
      at[0] + (dx + w) * dotScale,
      at[1] + (dy + h) * dotScale,
    ];
    const cost = (o: Point) => taken.filter((b) => overlaps(boxOf(o), b)).length;
    const best = options.reduce((m, o) => (cost(o) < cost(m) ? o : m));
    taken.push(boxOf(best));
    return best;
  });
}

type StateOverlayProps = {
  stateId: string;
  primary: AtlasTrip;
  others: AtlasTrip[];
  hidden: boolean;
  onPick: (slug: string) => void;
};

/** Back button and the card listing the state's trips. */
function StateOverlay({ stateId, primary, others, hidden, onPick }: StateOverlayProps) {
  const count = others.length + 1;
  return (
    <div className={styles.stateOverlay} style={{ opacity: hidden ? 0 : 1 }}>
      <Link href={homeHref} scroll={false} className={styles.backButton}>
        <span className={styles.backIcon} style={{ background: primary.color }}>
          <span className={styles.chevron} />
        </span>
        All of India
      </Link>

      <div className={styles.tripsCard}>
        <div className={styles.tripsTape} />
        <span className={styles.tripsKicker}>
          {stateName(stateId)}, {count} {count === 1 ? "trip" : "trips"}
        </span>
        <div className={styles.tripRow}>
          <span className={styles.tripLine} style={{ borderTopColor: primary.color }} />
          <span className={styles.tripTitle}>{primary.title}</span>
        </div>
        <span className={styles.tripMeta}>
          {[primary.range, `${primary.stops.length} ${primary.stops.length === 1 ? "stop" : "stops"}`]
            .filter(Boolean)
            .join(", ")}
        </span>
        {others.map((t) => (
          <button key={t.slug} type="button" className={styles.tripRow} onClick={() => onPick(t.slug)}>
            <span className={styles.tripLine} style={{ borderTopColor: t.color }} />
            <span className={styles.otherTripTitle}>{t.title}</span>
            <span className={styles.otherTripRange}>{t.range}</span>
          </button>
        ))}
        <span className={styles.tripsHint}>Click a photo to read that day</span>
      </div>
    </div>
  );
}

// Card geometry per home-page slot, from the design.
const SLOTS: Record<
  number,
  { width: number; pad: number; photo: number; title: number; rotate: number; delay: number; tape: CSSProperties; tapeColor: string }
> = {
  1: { width: 220, pad: 9, photo: 136, title: 18, rotate: -9, delay: 1, tape: { top: -9, left: 80, width: 60, height: 18, rotate: "-5deg" }, tapeColor: "pink" },
  2: { width: 176, pad: 8, photo: 104, title: 16, rotate: 7, delay: 1.15, tape: { top: -8, left: 58, width: 56, height: 16, rotate: "4deg" }, tapeColor: "green" },
  3: { width: 190, pad: 8, photo: 112, title: 17, rotate: 5, delay: 1.1, tape: { top: -8, left: 20, width: 56, height: 16, rotate: "-7deg" }, tapeColor: "yellow" },
  4: { width: 180, pad: 8, photo: 106, title: 17, rotate: -6, delay: 1.25, tape: { top: -8, right: 24, width: 54, height: 16, rotate: "6deg" }, tapeColor: "green" },
  5: { width: 200, pad: 9, photo: 124, title: 18, rotate: 11, delay: 1.05, tape: { top: -9, left: 66, width: 64, height: 18, rotate: "6deg" }, tapeColor: "yellow" },
  6: { width: 184, pad: 8, photo: 112, title: 17, rotate: -8, delay: 1.2, tape: { top: -8, left: 62, width: 58, height: 16, rotate: "-4deg" }, tapeColor: "pink" },
  7: { width: 186, pad: 8, photo: 108, title: 17, rotate: -5, delay: 1.3, tape: { top: -8, left: 64, width: 56, height: 16, rotate: "3deg" }, tapeColor: "green" },
  8: { width: 176, pad: 8, photo: 104, title: 16, rotate: 6, delay: 1.35, tape: { top: -8, left: 22, width: 54, height: 16, rotate: "-6deg" }, tapeColor: "pink" },
};

const STAMP_CLASSES = [styles.stampRect, styles.stampRound, styles.stampDouble];

type HomeOverlayProps = { data: AtlasData; visible: boolean; back: boolean; onHover: (id: string | null) => void };

/** Stamps, the visited counter and the polaroid cards on the India view. */
function HomeOverlay({ data, visible, back, onHover }: HomeOverlayProps) {
  const delay = visible && back ? "0.1s" : "0s";
  return (
    <div
      className={styles.overlay}
      style={{ opacity: visible ? 1 : 0, pointerEvents: "none", transitionDelay: delay }}
      aria-hidden={!visible}
    >
      <div className={styles.stamps}>
        {data.stamps.map((s, i) => (
          <div key={s.stateId} className={STAMP_CLASSES[i]}>
            <span className={styles.stampName}>{s.name}</span>
            <span className={styles.stampDate}>{s.date}</span>
          </div>
        ))}
      </div>

      <div className={styles.counter}>
        <div className={styles.counterRing} />
        <div className={styles.counterRingInner} />
        <span className={styles.counterValue}>
          {data.visited.length}/{data.totalStates}
        </span>
        <span className={styles.counterLabel}>states visited</span>
      </div>

      {/* Scattered around the map on wide screens; in a row above and below it on phones. */}
      <div className={styles.cards} style={{ pointerEvents: visible ? undefined : "none" }}>
        {data.cards.map((c) => (
          <Card key={c.slot} card={c} visible={visible} delay={delay} onHover={onHover} />
        ))}
      </div>
    </div>
  );
}

type CardProps = { card: HomeCard; visible: boolean; delay: string; onHover: (id: string | null) => void };

function Card({ card, visible, delay, onHover }: CardProps) {
  const s = SLOTS[card.slot];
  const shift = visible ? 0 : card.slot <= 3 ? -60 : 60;
  return (
    <Link
      href={card.href}
      scroll={false}
      tabIndex={visible ? undefined : -1}
      className={`${styles.card} ${styles[`slot${card.slot}`]}`}
      style={{ pointerEvents: visible ? "auto" : "none", transform: `translateX(${shift}px)`, transitionDelay: delay }}
      onMouseEnter={() => onHover(card.stateId)}
      onMouseLeave={() => onHover(null)}
    >
      <div
        className={styles.cardInner}
        style={
          { width: s.width, padding: `${s.pad}px ${s.pad}px 0`, "--rot": `${s.rotate}deg`, animationDelay: `${s.delay}s` } as CSSProperties
        }
      >
        <Photo photo={card.photo} style={{ height: s.photo }} />
        <div className={styles.cardText} style={{ padding: s.pad === 9 ? "9px 4px 12px" : "8px 4px 10px" }}>
          <span className={styles.cardTitle} style={{ fontSize: s.title }}>
            {card.title}
          </span>
          <span className={styles.cardSub}>
            <span className={styles.cardLine} style={{ borderTopColor: card.color }} />
            {card.subtitle}
          </span>
        </div>
        <div className={`${styles.tape} ${styles[s.tapeColor]}`} style={s.tape} />
      </div>
    </Link>
  );
}
