"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Loader } from "@/components/map/Loader";
import { findStop } from "@/lib/atlas";
import type { AtlasData } from "@/lib/content";
import { parseRoute, type Route } from "@/lib/routes";
import styles from "./Atlas.module.css";
import { useReady, useViewport } from "./hooks";
import { MapScene } from "./MapScene";
import { TransitionView } from "./TransitionView";

type View = "india" | "state" | "transition" | "blog" | "other";

export type Scene = {
  view: View;
  /** State shown zoomed in (state view, and while leaving it). */
  stateId: string | null;
  /** The stop the timeline transition is heading to. */
  stop: { tripSlug: string; stopSlug: string } | null;
  /** State view is animating back out to India. */
  leaving: boolean;
  /** Pins are fading out before the timeline transition. */
  opening: boolean;
  /** The post is fading out. */
  exiting: boolean;
  /** The sea-coloured wipe is covering the post on the way back to the map. */
  toMap: boolean;
  /** Arrived at India from the state view (shortens some entrance delays). */
  back: boolean;
  /** Timeline transition phase: 0 title, 1 track, 2 zoomed onto the stop. */
  phase: 0 | 1 | 2;
};

const CALM = { leaving: false, opening: false, exiting: false, toMap: false };

// Timings from the design, in ms.
const STATE_EXIT = 900;
const WIPE = 380;
const PINS_OUT = 260;
const POST_SWAP = 300;

function resolve(route: Route, data: AtlasData): Route {
  if (route.kind === "state" && !data.visited.some((v) => v.stateId === route.stateId)) return { kind: "other" };
  // The editor can open stops that aren't published, so aren't on the map.
  if (route.kind === "blog" && !route.edit && !findStop(data, route.tripSlug, route.stopSlug)) return { kind: "other" };
  return route;
}

function initialScene(route: Route, data: AtlasData): Scene {
  const base: Scene = { view: "india", stateId: null, stop: null, ...CALM, back: false, phase: 0 };
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

  // The last post shown, kept on screen while it animates away after the URL changes.
  const shownPost = useRef<ReactNode>(null);
  const [postOverride, setPostOverride] = useState<ReactNode | null>(null);

  // Switching a post in and out of edit mode isn't a navigation between views.
  const routeKey = JSON.stringify(route.kind === "blog" ? { ...route, edit: false } : route);
  const lastRouteKey = useRef(routeKey);

  // Play the design's exit and entrance animations whenever the URL changes,
  // whether from a click or the browser's back and forward buttons. The first
  // step is applied before paint so the old view never flashes in the new state.
  /* eslint-disable react-hooks/set-state-in-effect */
  useLayoutEffect(() => {
    if (lastRouteKey.current === routeKey) return;
    lastRouteKey.current = routeKey;
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
        set({ ...CALM, exiting: true, toMap: true });
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
        set({ ...CALM, exiting: true, toMap: true });
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
        set({ ...CALM, exiting: true, toMap: true });
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
    if (from.view === "blog") {
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
      set({ ...CALM, view: "transition", stop, phase: 0, stateId });
    });
    later(PINS_OUT + 60, () => set({ phase: 1 }));
    later(1000, () => set({ phase: 2 }));
    later(2550, () => set({ view: "blog", phase: 0 }));
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
        <TransitionView data={data} stop={scene.stop} phase={scene.phase} onSkip={skipTransition} />
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
      {scene.view === "blog" && (
        <div className={styles.wipe} style={{ clipPath: `circle(${scene.toMap ? 150 : 0}% at 6% 3%)` }} />
      )}
      <Loader visible={!ready} />
    </>
  );
}
