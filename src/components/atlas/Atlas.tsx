"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Loader } from "@/components/map/Loader";
import { findStop } from "@/lib/atlas";
import type { AtlasData } from "@/lib/content";
import { parseRoute, type Route } from "@/lib/routes";
import styles from "./Atlas.module.css";
import { useReady, useViewport } from "./hooks";
import { MapScene } from "./MapScene";
import { PAPER_MS, TRACK_PAN_MS, TransitionView } from "./TransitionView";

type View = "india" | "state" | "transition" | "blog" | "other";

export type Scene = {
  view: View;
  /** State shown zoomed in (state view, and while leaving it). */
  stateId: string | null;
  /** The stop the timeline transition is heading to. */
  stop: { tripSlug: string; stopSlug: string } | null;
  /** When switching dates within a trip, the stop being left: the timeline pans from it. */
  fromSlug: string | null;
  /** When the timeline's paper circle starts opening, in ms after it appears. */
  paperDelay: number;
  /** A sea-coloured circle growing from this point (viewport px) is covering the post. */
  wipe: { x: number; y: number } | null;
  /** State view is animating back out to India. */
  leaving: boolean;
  /** Pins are fading out before the timeline transition. */
  opening: boolean;
  /** The post is fading out. */
  exiting: boolean;
  /** Arrived at India from the state view (shortens some entrance delays). */
  back: boolean;
  /** Timeline transition phase: 0 title, 1 track, 2 zoomed onto the stop. */
  phase: 0 | 1 | 2;
};

const CALM = { leaving: false, opening: false, exiting: false, wipe: null };

// Timings from the design, in ms.
const STATE_EXIT = 900;
/** Matches the .wipe animation in Atlas.module.css. */
const WIPE = 450;
const PINS_OUT = 260;
const POST_SWAP = 300;
// Map to post: the timeline appears once the pins are gone, then zooms onto the stop.
const ZOOM_AT = 740;
const PAPER_AT = 1850;
// Switching dates: once the wipe covers the post, the timeline pans to the new date.
const PAN_AT = 50;
const DATE_PAPER_AT = PAN_AT + TRACK_PAN_MS - 150;

function resolve(route: Route, data: AtlasData): Route {
  if (route.kind === "state" && !data.visited.some((v) => v.stateId === route.stateId)) return { kind: "other" };
  // The editor can open stops that aren't published, so aren't on the map.
  if (route.kind === "blog" && !route.edit && !findStop(data, route.tripSlug, route.stopSlug)) return { kind: "other" };
  return route;
}

function initialScene(route: Route, data: AtlasData): Scene {
  const base: Scene = {
    view: "india",
    stateId: null,
    stop: null,
    fromSlug: null,
    paperDelay: PAPER_AT,
    ...CALM,
    back: false,
    phase: 0,
  };
  switch (route.kind) {
    case "state":
      return { ...base, view: "state", stateId: route.stateId };
    case "blog":
      return { ...base, view: "blog", stateId: findStop(data, route.tripSlug, route.stopSlug)?.trip.stateId ?? null };
    default:
      return { ...base, view: route.kind };
  }
}

export function Atlas({ data, sea, children }: { data: AtlasData; sea: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const route = resolve(parseRoute(pathname), data);
  const viewport = useViewport();
  const ready = useReady();
  const [scene, setScene] = useState<Scene>(() => initialScene(route, data));

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);
  const set = useCallback((patch: Partial<Scene>) => setScene((s) => ({ ...s, ...patch })), []);

  // Where the last click or tap landed, so a wipe can grow from the link that was pressed.
  const lastPointer = useRef<{ x: number; y: number; at: number } | null>(null);
  useEffect(() => {
    const onDown = (e: PointerEvent) => (lastPointer.current = { x: e.clientX, y: e.clientY, at: performance.now() });
    window.addEventListener("pointerdown", onDown, true);
    return () => window.removeEventListener("pointerdown", onDown, true);
  }, []);
  /** The recent click position, or `fallback` (fractions of the viewport) after a keyboard or history navigation. */
  const wipeFrom = (fallback: [number, number]) => {
    const p = lastPointer.current;
    if (p && performance.now() - p.at < 1500) return { x: p.x, y: p.y };
    return { x: window.innerWidth * fallback[0], y: window.innerHeight * fallback[1] };
  };

  // The last post shown, kept on screen while it animates away after the URL changes.
  const shownPost = useRef<ReactNode>(null);
  const [postOverride, setPostOverride] = useState<ReactNode | null>(null);

  // Switching a post in and out of edit mode isn't a navigation between views.
  const routeKey = JSON.stringify(route.kind === "blog" ? { ...route, edit: false } : route);
  const lastRouteKey = useRef(routeKey);
  const lastRoute = useRef(route);

  // Play the design's exit and entrance animations whenever the URL changes,
  // whether from a click or the browser's back and forward buttons. The first
  // step is applied before paint so the old view never flashes in the new state.
  /* eslint-disable react-hooks/set-state-in-effect */
  useLayoutEffect(() => {
    if (lastRouteKey.current === routeKey) return;
    lastRouteKey.current = routeKey;
    const prev = lastRoute.current;
    lastRoute.current = route;
    clearTimers();
    const from = scene;
    const fromPost = from.view === "blog" || from.view === "transition";
    const toTop = () => window.scrollTo(0, 0);

    if (route.kind === "other") {
      setPostOverride(null);
      setScene((s) => ({ ...s, ...CALM, view: "other" }));
      return;
    }

    if (route.kind === "india") {
      if (fromPost && !from.stateId) {
        // Leaving a post that isn't on the map: there's no state to zoom out of.
        setPostOverride(shownPost.current);
        set({ ...CALM, exiting: true, wipe: wipeFrom([0.06, 0.03]) });
        later(WIPE, () => {
          toTop();
          setPostOverride(null);
          set({ ...CALM, view: "india", back: false, phase: 0 });
        });
        return;
      }
      if (from.view === "state") {
        set({ ...CALM, leaving: true });
        later(STATE_EXIT, () => set({ view: "india", leaving: false, back: true, stateId: null }));
      } else if (fromPost) {
        setPostOverride(shownPost.current);
        set({ ...CALM, exiting: true, wipe: wipeFrom([0.06, 0.03]) });
        later(WIPE, () => {
          toTop();
          setPostOverride(null);
          set({ ...CALM, view: "state", leaving: true, phase: 0 });
        });
        later(WIPE + STATE_EXIT, () => set({ view: "india", leaving: false, back: true, stateId: null }));
      } else {
        set({ ...CALM, view: "india", stateId: null, back: false });
      }
      return;
    }

    if (route.kind === "state") {
      if (fromPost) {
        setPostOverride(shownPost.current);
        set({ ...CALM, exiting: true, wipe: wipeFrom([0.06, 0.03]) });
        later(WIPE, () => {
          toTop();
          setPostOverride(null);
          set({ ...CALM, view: "india", back: false, phase: 0 });
        });
        later(WIPE + 100, () => set({ view: "state", stateId: route.stateId }));
      } else {
        set({ ...CALM, view: "state", stateId: route.stateId, back: false });
      }
      return;
    }

    // route.kind === "blog"
    const target = findStop(data, route.tripSlug, route.stopSlug);
    const stop = { tripSlug: route.tripSlug, stopSlug: route.stopSlug };
    const stateId = target?.trip.stateId ?? null;
    const prevStop = prev.kind === "blog" ? prev : null;
    if (from.view === "blog" && target && !route.edit && prevStop && !prevStop.edit && prevStop.tripSlug === route.tripSlug) {
      // Another date on the same trip: cover the post from the link that was pressed, then
      // pan along the trip's timeline from the old date to the new one and open it.
      setPostOverride(shownPost.current);
      set({ ...CALM, wipe: wipeFrom([0.5, 0.06]) });
      later(WIPE, () => {
        toTop();
        setPostOverride(null);
        set({ ...CALM, view: "transition", stop, stateId, fromSlug: prevStop.stopSlug, paperDelay: DATE_PAPER_AT, phase: 1 });
      });
      later(WIPE + PAN_AT, () => set({ phase: 2 }));
      later(WIPE + DATE_PAPER_AT + PAPER_MS, () => set({ view: "blog", phase: 0, fromSlug: null }));
      return;
    }
    if (from.view === "blog") {
      // Within the editor: a quick fade.
      setPostOverride(shownPost.current);
      set({ ...CALM, exiting: true });
      later(POST_SWAP, () => {
        toTop();
        setPostOverride(null);
        set({ exiting: false, stateId });
      });
      return;
    }
    // The editor opens straight onto the post; so does a post with no place on the map.
    if (route.edit || !target || from.view === "other") {
      setPostOverride(null);
      toTop();
      set({ ...CALM, view: "blog", stop, stateId, phase: 0 });
      return;
    }
    set({ ...CALM, opening: true });
    later(PINS_OUT, () => {
      toTop();
      set({ ...CALM, view: "transition", stop, phase: 0, stateId, fromSlug: null, paperDelay: PAPER_AT });
    });
    later(PINS_OUT + 60, () => set({ phase: 1 }));
    later(PINS_OUT + ZOOM_AT, () => set({ phase: 2 }));
    // Show the post once the paper circle has filled the screen.
    later(PINS_OUT + PAPER_AT + PAPER_MS, () => set({ view: "blog", phase: 0 }));
  }, [routeKey, route, scene, data, later, set]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => clearTimers, []);

  const skipTransition = () => {
    clearTimers();
    set({ view: "blog", phase: 0 });
  };

  useEffect(() => {
    if (scene.view === "blog" && !postOverride) shownPost.current = children;
  });

  const inMap = scene.view === "india" || scene.view === "state";
  const post = postOverride ?? children;

  return (
    <>
      {inMap && <MapScene data={data} scene={scene} viewport={viewport} sea={sea} />}
      {scene.view === "transition" && scene.stop && (
        <TransitionView
          data={data}
          stop={scene.stop}
          fromSlug={scene.fromSlug}
          phase={scene.phase}
          paperDelay={scene.paperDelay}
          vertical={viewport.mobile ? { height: viewport.height } : null}
          onSkip={skipTransition}
        />
      )}
      {scene.view === "blog" && (
        // Only set translate while fading out: any translate makes the post a containing
        // block, which would pin its position: fixed children (the edit bar) to the article.
        <div
          className={styles.post}
          style={{ opacity: scene.exiting ? 0 : 1, translate: scene.exiting ? "0 18px" : "none" }}
        >
          {post}
        </div>
      )}
      {scene.view === "other" && children}
      {scene.view === "blog" && scene.wipe && (
        <div className={styles.wipe} style={{ "--x": `${scene.wipe.x}px`, "--y": `${scene.wipe.y}px` } as CSSProperties} />
      )}
      <Loader visible={!ready} />
    </>
  );
}
