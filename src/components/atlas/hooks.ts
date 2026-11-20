"use client";

import { useEffect, useState } from "react";

export type Viewport = {
  mobile: boolean;
  /** Scale for the 700x800 canvas on the India view. */
  fitIndia: number;
  /** Scale on the state view (fills the width on phones). */
  fitState: number;
};

function measure(): Viewport {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const mobile = W < 900;
  const fitIndia = mobile
    ? Math.min(W / 652, (H - 60) / 800)
    : Math.max(0.6, Math.min((H - 40) / 800, (W - 64) / 700, 1.3));
  return { mobile, fitIndia, fitState: mobile ? W / 700 : fitIndia };
}

export function useViewport(): Viewport {
  const [vp, setVp] = useState<Viewport>({ mobile: false, fitIndia: 1, fitState: 1 });
  useEffect(() => {
    const onResize = () =>
      setVp((v) => {
        const n = measure();
        const same =
          n.mobile === v.mobile &&
          Math.abs(n.fitIndia - v.fitIndia) < 0.004 &&
          Math.abs(n.fitState - v.fitState) < 0.004;
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
