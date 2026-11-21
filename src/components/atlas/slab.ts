import type { Zoom } from "@/lib/map";

/** Cubic-bezier easing, like CSS `cubic-bezier(x1, y1, x2, y2)`. */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const curve = (a: number, b: number, t: number) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
  const slope = (a: number, b: number, t: number) => 3 * a * (1 - t) ** 2 + 6 * (b - a) * t * (1 - t) + 3 * (1 - b) * t * t;
  return (x: number) => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const d = slope(x1, x2, t);
      if (Math.abs(d) < 1e-6) break;
      t -= (curve(x1, x2, t) - x) / d;
    }
    return curve(y1, y2, Math.min(1, Math.max(0, t)));
  };
}

type Motion = {
  duration: number;
  /** Progress from India (0) to zoomed in (1) over time. */
  ease: (u: number) => number;
  from: number;
  to: number;
  /** Upward hop at mid-flight, and tilt, in canvas px and degrees. */
  hop: number;
  tilt: number;
};

const GROW: Motion = { duration: 1100, ease: bezier(0.3, 1.12, 0.42, 1), from: 0, to: 1, hop: 40, tilt: -4 };
const SHRINK: Motion = { duration: 850, ease: bezier(0.5, 0, 0.3, 1), from: 1, to: 0, hop: 30, tilt: 3 };

export const SLAB_GROW_MS = GROW.duration;

/**
 * Keyframes for the state slab flying out of the map.
 *
 * The slab is drawn already zoomed in, so these move the whole layer from where the
 * state sits on the India map (`s = 0`) to its zoomed position (`s = 1`). Animating
 * only the layer's transform keeps it on the compositor, so it stays smooth while
 * the page is busy, and sampling the path densely gives one continuous curve
 * instead of easing that restarts at every keyframe.
 */
export function slabAnimation(z: Zoom, leaving: boolean): { keyframes: Keyframe[]; duration: number } {
  const m = leaving ? SHRINK : GROW;
  const steps = 48;
  const keyframes: Keyframe[] = [];
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const s = m.from + (m.to - m.from) * m.ease(u);
    const arc = Math.sin(Math.PI * Math.min(1, Math.max(0, s)));
    // Where the design's animation would put a point p at progress s:
    //   G(p) = T + a * R * p, with a = 1 + (k - 1) s and T = s * t - hop.
    // The layer is drawn at F(p) = k * p + t, so it needs G(F^-1(q)) = T + (a / k) R (q - t).
    const a = 1 + (z.k - 1) * s;
    const angle = (m.tilt * arc * Math.PI) / 180;
    const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
    const l = a / z.k;
    const [tx, ty] = [s * z.tx, s * z.ty - m.hop * arc];
    const e = tx - l * (cos * z.tx - sin * z.ty);
    const f = ty - l * (sin * z.tx + cos * z.ty);
    const n = (v: number) => v.toFixed(5);
    keyframes.push({ offset: u, transform: `matrix(${n(l * cos)},${n(l * sin)},${n(-l * sin)},${n(l * cos)},${n(e)},${n(f)})` });
  }
  return { keyframes, duration: m.duration };
}
