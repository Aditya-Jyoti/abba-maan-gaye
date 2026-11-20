import mapJson from "@/data/india-map.json";

// Map geometry exported with the design. Coordinates are in a 700x800 canvas.
export type Point = [number, number];

export type MapState = {
  id: string;
  name: string;
  d: string;
  cx: number;
  cy: number;
  hue: number;
  bb: [Point, Point];
};

type LabelAnchor = {
  lx: number;
  ly: number;
  r: number;
  ang: number;
  ix: number;
  iy: number;
  ir: number;
  i2x: number;
  i2y: number;
  i2r: number;
};

type MapData = {
  w: number;
  h: number;
  states: MapState[];
  places: Record<string, Point>;
  outline: string;
  mhDistricts: string;
  cities: Record<string, Point>;
  labels: Record<string, LabelAnchor>;
  lakshadweep: [number, number, number][];
};

export const map = mapJson as unknown as MapData;

export const stateById = new Map(map.states.map((s) => [s.id, s]));

export function stateName(id: string): string {
  return stateById.get(id)?.name ?? id;
}

const hueOf = (h: number) => (h * 0.85 + 12) % 360;
export const stateFill = (hue: number) => `oklch(0.85 0.1 ${hueOf(hue)})`;
export const stateSide = (hue: number) => `oklch(0.66 0.09 ${hueOf(hue)})`;

export const SEA = "oklch(0.74 0.075 192)";
export const TRIP_COLORS = ["oklch(0.62 0.16 32)", "oklch(0.5 0.1 200)"];
export const tripColor = (index: number) => TRIP_COLORS[index % TRIP_COLORS.length];

/** How far a state lifts on hover, in canvas px. */
export const LIFT = 11;

export type IconType =
  | "taj"
  | "qutub"
  | "konark"
  | "hawa"
  | "gateway"
  | "golden"
  | "charminar"
  | "victoria"
  | "gopuram"
  | "boat"
  | "stupa"
  | "mountain"
  | "palm"
  | "pine"
  | "temple"
  | "camel"
  | "statue"
  | "palace"
  | "waterfall"
  | "hills"
  | "tea"
  | "tree";

type StateStyle = {
  /** Display name, with \n for line breaks. */
  n?: string;
  icon?: IconType;
  icon2?: IconType;
  /** Label rotation override, degrees. */
  ang?: number;
  /** Small states get a pill label on a leader line instead: [x, y, anchor]. */
  lead?: [number, number, "start" | "middle" | "end"];
  /** Icon at a fixed spot: [x, y, type, scale]. */
  iconAt?: [number, number, IconType, number];
  /** Where the leader line starts, if not the label anchor. */
  dot?: Point;
};

// Hand-tuned per-state styling from the design.
const STATE_STYLE: Record<string, StateStyle> = {
  ladakh: { icon: "mountain", icon2: "mountain" },
  "jammu-and-kashmir": { n: "Jammu &\nKashmir", icon: "boat" },
  "himachal-pradesh": { n: "Himachal\nPradesh", icon: "pine" },
  punjab: { icon: "golden" },
  chandigarh: { lead: [238, 188, "start"] },
  delhi: { lead: [256, 262, "start"], iconAt: [246, 270, "qutub", 0.62] },
  uttarakhand: { icon: "temple" },
  "uttar-pradesh": { n: "Uttar\nPradesh", icon: "taj", icon2: "tree" },
  rajasthan: { icon: "hawa", icon2: "camel" },
  gujarat: { icon: "statue", icon2: "camel" },
  "madhya-pradesh": { n: "Madhya\nPradesh", icon: "stupa", icon2: "tree" },
  maharashtra: { icon: "gateway", icon2: "hills", ang: -6 },
  goa: { lead: [134, 592, "end"] },
  karnataka: { icon: "palace", icon2: "palm" },
  kerala: { icon: "boat" },
  "tamil-nadu": { n: "Tamil\nNadu", icon: "gopuram", icon2: "palm" },
  puducherry: { lead: [300, 690, "start"] },
  "andhra-pradesh": { n: "Andhra\nPradesh", icon: "temple" },
  telangana: { icon: "charminar" },
  chhattisgarh: { icon: "waterfall" },
  odisha: { icon: "konark" },
  jharkhand: { icon: "hills" },
  bihar: { icon: "stupa" },
  "west-bengal": { n: "West\nBengal", icon: "victoria" },
  sikkim: { lead: [478, 262, "middle"] },
  assam: { icon: "tea" },
  "arunachal-pradesh": { n: "Arunachal\nPradesh", icon: "pine" },
  meghalaya: { icon: "waterfall" },
  nagaland: { ang: 0 },
  tripura: { lead: [534, 404, "end"] },
  "dadra-and-nagar-haveli-and-daman-and-diu": { n: "DNH & DD", lead: [114, 456, "end"] },
  "andaman-and-nicobar-islands": { n: "Andaman & Nicobar", lead: [592, 622, "start"] },
  lakshadweep: { lead: [100, 706, "end"], dot: [124.3, 684.3] },
};

export type StateLabel = { stateId: string; text: string; x: number; y: number; angle: number; size: number };
export type StateLead = {
  stateId: string;
  text: string;
  /** Label position. */
  lx: number;
  ly: number;
  /** Dot position on the state. */
  cx: number;
  cy: number;
  /** Horizontal anchor as a CSS translate percentage. */
  ax: string;
};
export type StateIcon = { stateId: string; type: IconType; x: number; y: number; scale: number };

export type MapDecor = { labels: StateLabel[]; leads: StateLead[]; icons: StateIcon[] };

/** Labels, leader lines and landmark icons for the India view. */
export function mapDecor(mobile: boolean): MapDecor {
  const labels: StateLabel[] = [];
  const leads: StateLead[] = [];
  const icons: StateIcon[] = [];

  for (const st of map.states) {
    const c = STATE_STYLE[st.id] ?? {};
    const l = map.labels[st.id];
    if (!l) continue;
    const text = c.n ?? st.name;

    if (c.lead) {
      const [lx, ly, anchor] = c.lead;
      leads.push({
        stateId: st.id,
        text,
        lx,
        ly,
        cx: c.dot ? c.dot[0] : l.lx,
        cy: c.dot ? c.dot[1] : l.ly,
        ax: anchor === "end" ? "-100%" : anchor === "start" ? "0%" : "-50%",
      });
    } else {
      const size = Math.max(7.5, Math.min(13.5, l.r * 0.4)) * (mobile ? 1.3 : 1);
      labels.push({ stateId: st.id, text, x: l.lx, y: l.ly, angle: c.ang ?? l.ang, size: +size.toFixed(1) });
    }

    const add = (type: IconType, x: number, y: number, room: number) => {
      const scale = Math.max(0.5, Math.min(1, room / 16));
      icons.push({ stateId: st.id, type, x, y: +(y + 11 * scale).toFixed(1), scale: +scale.toFixed(2) });
    };
    if (c.icon) add(c.icon, l.ix, l.iy, l.ir);
    if (c.icon2 && l.i2r > 6 && !mobile) add(c.icon2, l.i2x, l.i2y, l.i2r);
    if (c.iconAt) {
      const [x, y, type, scale] = c.iconAt;
      icons.push({ stateId: st.id, type, x, y, scale });
    }
  }
  return { labels, leads, icons };
}

// Where the polaroid previews sit on visited states: [x, y, rotation].
// States not listed fall back to their centre.
const PREVIEW_SPOTS: Record<string, [number, number, number][]> = {
  maharashtra: [
    [150, 486, -8],
    [173, 502, 7],
  ],
  rajasthan: [[map.places.jaisalmer[0] + 4, map.places.jaisalmer[1] + 2, -6]],
  kerala: [[map.places.alleppey[0], map.places.alleppey[1] + 2, 6]],
};

export function previewSpots(stateId: string, count: number): [number, number, number][] {
  const spots = PREVIEW_SPOTS[stateId];
  if (spots) return spots.slice(0, count);
  const st = stateById.get(stateId);
  if (!st) return [];
  if (count === 1) return [[st.cx, st.cy - 20, -6]];
  return [
    [st.cx - 26, st.cy - 20, -6],
    [st.cx + 26, st.cy - 6, 7],
  ];
}

// ---- State view -------------------------------------------------------------

export const stateFillDim = (hue: number) => `oklch(0.9 0.03 ${hueOf(hue)})`;
export const stateSideDim = (hue: number) => `oklch(0.8 0.03 ${hueOf(hue)})`;
/** Colour left behind on the India map where the zoomed state lifts out. */
export const SOCKET = "oklch(0.55 0.05 192)";

export type Zoom = { k: number; tx: number; ty: number };

type ByLayout<T> = { desktop?: T; mobile?: T };

type StateView = {
  /** Area to frame instead of the whole state: [[x0, y0], [x1, y1]]. */
  region?: ByLayout<[Point, Point]>;
  /** Absolute canvas positions for stop callouts, by place key. */
  callouts?: ByLayout<Record<string, Point>>;
  /** Reference cities to dot on the map (keys of map.cities). */
  cities?: ByLayout<string[]>;
  /** Cities whose label goes on the left of the dot. */
  citiesLeft?: ByLayout<string[]>;
  /** Vertical label offsets for secondary-trip pins, by place key. */
  pinLabelY?: Record<string, number>;
};

// Hand-tuned layouts from the design. Other states use computed defaults.
const STATE_VIEWS: Record<string, StateView> = {
  maharashtra: {
    region: { mobile: [[112, 445], [215, 550]] },
    callouts: {
      desktop: { mumbai: [-34, 330], alibaug: [-44, 468], lonavala: [222, 372], pune: [262, 470], mahabaleshwar: [228, 580] },
      mobile: { mumbai: [146, 226], alibaug: [150, 500], lonavala: [330, 250], pune: [470, 420], mahabaleshwar: [430, 618] },
    },
    cities: {
      desktop: ["nagpur", "solapur", "kolhapur", "amravati", "nanded", "ratnagiri", "chandrapur", "jalgaon", "latur"],
      mobile: ["solapur", "kolhapur", "ratnagiri", "satara"],
    },
    citiesLeft: { desktop: ["ratnagiri"], mobile: ["ratnagiri", "solapur"] },
    pinLabelY: { aurangabad: 12, ellora: -16 },
  },
};

const layoutOf = <T,>(v: ByLayout<T> | undefined, mobile: boolean) => (mobile ? v?.mobile : v?.desktop);

/** Transform that frames a state in the canvas. */
export function stateZoom(stateId: string, mobile: boolean): Zoom {
  const st = stateById.get(stateId);
  if (!st) return { k: 1, tx: 0, ty: 0 };
  const [[x0, y0], [x1, y1]] = layoutOf(STATE_VIEWS[stateId]?.region, mobile) ?? st.bb;
  const [cx, cy, w, h] = mobile ? [350, 400, 640, 700] : [420, 410, 980, 640];
  const k = Math.min(w / (x1 - x0), h / (y1 - y0), 10);
  return { k, tx: cx - (k * (x0 + x1)) / 2, ty: cy - (k * (y0 + y1)) / 2 };
}

export const applyZoom = (p: Point, z: Zoom): Point => [p[0] * z.k + z.tx, p[1] * z.k + z.ty];

/** Where each stop's photo callout sits, in canvas coordinates. */
export function calloutPoints(stateId: string, pins: { key: string | null; at: Point }[], mobile: boolean): Point[] {
  const fixed = layoutOf(STATE_VIEWS[stateId]?.callouts, mobile) ?? {};
  const cx = pins.reduce((s, p) => s + p.at[0], 0) / (pins.length || 1);
  const cy = pins.reduce((s, p) => s + p.at[1], 0) / (pins.length || 1);
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const points: Point[] = pins.map(({ key, at }) => {
    if (key && fixed[key]) return fixed[key];
    // Push the callout away from the middle of the route.
    let [dx, dy] = [at[0] - cx, at[1] - cy];
    const len = Math.hypot(dx, dy);
    [dx, dy] = len < 1 ? [0, -1] : [dx / len, dy / len];
    return [clamp(at[0] + dx * 150, 40, 660), clamp(at[1] + dy * 150, 60, 760)];
  });

  // Nudge computed callouts apart so the polaroids (about 80x90) don't overlap.
  const movable = pins.map(({ key }) => !(key && fixed[key]));
  for (let round = 0; round < 40; round++) {
    let moved = false;
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const [a, b] = [points[i], points[j]];
        const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
        const [ox, oy] = [92 - Math.abs(dx), 104 - Math.abs(dy)];
        if (ox <= 0 || oy <= 0) continue;
        moved = true;
        // Separate along the axis that needs the smaller move.
        const [sx, sy] = ox < oy ? [(Math.sign(dx) || 1) * ox, 0] : [0, (Math.sign(dy) || 1) * oy];
        const share = movable[i] && movable[j] ? 0.5 : 1;
        if (movable[i]) points[i] = [clamp(a[0] - sx * share, 40, 660), clamp(a[1] - sy * share, 60, 760)];
        if (movable[j]) points[j] = [clamp(b[0] + sx * share, 40, 660), clamp(b[1] + sy * share, 60, 760)];
      }
    }
    if (!moved) break;
  }
  return points;
}

export function stateCities(stateId: string, z: Zoom, mobile: boolean) {
  const v = STATE_VIEWS[stateId];
  const left = layoutOf(v?.citiesLeft, mobile) ?? [];
  return (layoutOf(v?.cities, mobile) ?? [])
    .filter((k) => map.cities[k])
    .map((k) => {
      const [x, y] = applyZoom(map.cities[k], z);
      return { key: k, name: k[0].toUpperCase() + k.slice(1), x, y, left: left.includes(k) };
    });
}

export const pinLabelY = (stateId: string, placeKey: string | null) =>
  (placeKey && STATE_VIEWS[stateId]?.pinLabelY?.[placeKey]) ?? -4;

/** Smooth path through points, each segment bowed sideways by `bend`. */
export function curve(pts: Point[], bend = 0.22): string {
  return pts.reduce((d, p, i) => {
    if (!i) return `M${p[0]},${p[1]}`;
    const q = pts[i - 1];
    const [mx, my] = [(q[0] + p[0]) / 2, (q[1] + p[1]) / 2];
    const [dx, dy] = [p[0] - q[0], p[1] - q[1]];
    return `${d} Q${(mx - dy * bend).toFixed(1)},${(my + dx * bend).toFixed(1)} ${p[0]},${p[1]}`;
  }, "");
}

export const districtsFor = (stateId: string) => (stateId === "maharashtra" ? map.mhDistricts : "");
