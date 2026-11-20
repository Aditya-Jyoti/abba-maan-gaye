"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Photo } from "@/components/Photo";
import { ICONS } from "@/components/map/icons";
import type { AtlasData, AtlasTrip, HomeCard } from "@/lib/content";
import {
  applyZoom,
  calloutPoints,
  curve,
  districtsFor,
  LIFT,
  map,
  mapDecor,
  pinLabelY,
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

type Props = { data: AtlasData; scene: Scene; viewport: Viewport; sea: ReactNode };

export function MapScene({ data, scene, viewport, sea }: Props) {
  const router = useRouter();
  const { mobile } = viewport;
  const [hover, setHover] = useState<string | null>(null);
  const [picked, setPicked] = useState<{ stateId: string; slug: string } | null>(null);

  const india = scene.view === "india";
  const zoomedId = scene.view === "state" ? scene.stateId : null;
  const zoom = useMemo(() => (zoomedId ? stateZoom(zoomedId, mobile) : null), [zoomedId, mobile]);
  const decor = useMemo(() => mapDecor(mobile), [mobile]);
  const visited = useMemo(() => new Map(data.visited.map((v) => [v.stateId, v])), [data.visited]);

  const stateTrips = zoomedId ? data.trips.filter((t) => t.stateId === zoomedId) : [];
  const primary =
    stateTrips.find((t) => picked?.stateId === zoomedId && t.slug === picked.slug) ?? stateTrips[0] ?? null;
  const others = stateTrips.filter((t) => t !== primary);

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
          <svg viewBox="0 0 700 800" width="700" height="800" className={styles.svg}>
            <g className={styles.india} style={indiaStyle}>
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
            {!mobile &&
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

        {zoomedId && zoom && <StateSlab stateId={zoomedId} zoom={zoom} leaving={scene.leaving} />}

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
                <Photo photo={null} style={{ height: 24, padding: 0 }} stripe={4} />
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

        {zoomedId && zoom && primary && (
          <StatePins
            stateId={zoomedId}
            zoom={zoom}
            primary={primary}
            others={others}
            hidden={scene.leaving || scene.opening}
            mobile={mobile}
            fit={viewport.fitState}
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

/** The zoomed state, lifted out of the map as a thick slab. */
function StateSlab({ stateId, zoom, leaving }: { stateId: string; zoom: Zoom; leaving: boolean }) {
  const st = stateById.get(stateId)!;
  const side = stateSide(st.hue);
  const depth = leaving
    ? "ghDepthOut .85s cubic-bezier(.5,0,.3,1) both"
    : "ghDepth 1.2s cubic-bezier(.3,1.15,.45,1) both";
  const districts = districtsFor(stateId);
  return (
    <svg viewBox="0 0 700 800" width="700" height="800" className={styles.slab}>
      <g
        className={styles.slabGroup}
        style={
          {
            "--tx": `${zoom.tx.toFixed(1)}px`,
            "--ty": `${zoom.ty.toFixed(1)}px`,
            "--k": zoom.k.toFixed(3),
            animation: leaving
              ? "ghShrink .85s cubic-bezier(.5,0,.3,1) both"
              : "ghGrow 1.2s cubic-bezier(.3,1.15,.45,1) both",
          } as CSSProperties
        }
      >
        {[1, 0.66, 0.33].map((m) => (
          <path
            key={m}
            d={st.d}
            className={styles.side}
            fill={side}
            stroke={side}
            style={{ "--m": m, animation: depth } as CSSProperties}
          />
        ))}
        <path d={st.d} className={styles.slabTop} fill={stateFill(st.hue)} />
        {districts && (
          <path
            d={districts}
            className={styles.districts}
            style={{ animation: leaving ? "ghOut .25s ease both" : "ghIn .5s 1s ease both" }}
          />
        )}
      </g>
    </svg>
  );
}

const PIN_TILT = [-5, 4, -3, 6, -4];

type PinsProps = {
  stateId: string;
  zoom: Zoom;
  primary: AtlasTrip;
  others: AtlasTrip[];
  hidden: boolean;
  mobile: boolean;
  fit: number;
};

/** Route lines, stop pins and photo callouts on the state view. */
function StatePins({ stateId, zoom, primary, others, hidden, mobile, fit }: PinsProps) {
  const pinScale = mobile ? (1.05 / fit).toFixed(2) : "1";
  const dotScale = mobile ? (0.95 / fit).toFixed(2) : "1";

  const pins = primary.stops.flatMap((s) => {
    const at = s.at && applyZoom(s.at, zoom);
    return at ? [{ stop: s, at }] : [];
  });
  const callouts = calloutPoints(
    stateId,
    pins.map((p) => ({ key: p.stop.placeKey, at: p.at })),
    mobile,
  );
  const otherPins = others.map((t) => ({
    trip: t,
    pins: t.stops.flatMap((s) => {
      const at = s.at && applyZoom(s.at, zoom);
      return at ? [{ stop: s, at }] : [];
    }),
  }));
  const cities = stateCities(stateId, zoom, mobile);

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

      {otherPins.flatMap(({ trip, pins: ps }) =>
        ps.map(({ stop, at }) => {
          const body = (
            <>
              <span className={styles.otherRing} style={{ borderColor: trip.color }} />
              <span className={styles.otherDot} style={{ background: trip.color }} />
              <span className={styles.otherName} style={{ top: pinLabelY(stateId, stop.placeKey) }}>
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
              animationDelay: `${1300 + i * 90}ms`,
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
          style={{ left: at[0], top: at[1], scale: dotScale, animationDelay: `${1100 + i * 90}ms` }}
        >
          <span className={styles.pinPulse} style={{ borderColor: primary.color }} />
          <span className={styles.pinRing} style={{ borderColor: primary.color }} />
          <span className={styles.pinDot} style={{ background: primary.color }} />
        </Link>
      ))}
    </div>
  );
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

      {data.cards.map((c) => (
        <Card key={c.slot} card={c} visible={visible} delay={delay} onHover={onHover} />
      ))}
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
