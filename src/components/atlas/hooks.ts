"use client";

import { useEffect, useState } from "react";

export type Viewport = {
  /** A phone held upright (or any narrow window): the portrait layout. */
  mobile: boolean;
  /** A phone on its side: short and wide. Matches the CSS `(orientation: landscape) and (max-height: 559px)`. */
  short: boolean;
  /** Scale for the 700x800 canvas on the India view. */
  fitIndia: number;
  /** Scale on the state view (fills the width on phones). */
  fitState: number;
  /** Window size in px. */
  width: number;
  height: number;
};

/** On upright phones, height kept clear for the rows of home cards above and below India. */
const HOME_ROWS = 220;

function measure(): Viewport {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const short = W > H && H < 560;
  const mobile = W < 900 && !short;
  const fitIndia = mobile
    ? Math.min(W / 652, (H - 40 - HOME_ROWS) / 800)
    : short
      ? (H - 20) / 800
      : Math.max(0.6, Math.min((H - 40) / 800, (W - 64) / 700, 1.3));
  return { mobile, short, fitIndia, fitState: mobile ? W / 700 : fitIndia, width: W, height: H };
}

export function useViewport(): Viewport {
  const [vp, setVp] = useState<Viewport>({ mobile: false, short: false, fitIndia: 1, fitState: 1, width: 1280, height: 800 });
  useEffect(() => {
    const onResize = () =>
      setVp((v) => {
        const n = measure();
        const same =
          n.mobile === v.mobile &&
          n.short === v.short &&
          n.width === v.width &&
          Math.abs(n.fitIndia - v.fitIndia) < 0.004 &&
          Math.abs(n.fitState - v.fitState) < 0.004 &&
          n.height === v.height;
        return same ? v : n;
      });
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return vp;
}

/** True once fonts have loaded, and at least 900ms have passed so the loader doesn't flash. */
export function useReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    Promise.all([document.fonts?.ready, new Promise((r) => setTimeout(r, 900))]).then(
      () => live && setReady(true),
    );
    return () => {
      live = false;
    };
  }, []);
  return ready;
}
