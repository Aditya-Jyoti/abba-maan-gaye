"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StopContent } from "@/db/schema";
import { saveDraft, type Conflict } from "@/lib/cms/actions";

export type SaveStatus =
  | { kind: "idle" }
  | { kind: "unsaved" }
  | { kind: "saving" }
  | { kind: "saved"; at: string }
  | { kind: "error"; message: string; retrying: boolean }
  | { kind: "conflict"; conflict: Conflict }
  | { kind: "signed-out" };

const DELAY = 900;
const RETRY = 5000;

/** Unsaved work is also kept in the browser, in case the tab closes or the session ends first. */
export const backupKey = (stopId: string) => `gk:unsaved:${stopId}`;
export type Backup = { version: number; content: StopContent; at: string };

/**
 * Saves the stop's content as a draft shortly after each change. Saves run one
 * at a time; changes made during a save are picked up by the next one.
 */
export function useAutosave(stopId: string, initialVersion: number, content: StopContent, onSaved: () => void) {
  const [status, setStatus] = useState<SaveStatus>({ kind: "idle" });
  const version = useRef(initialVersion);
  const latest = useRef(content);
  const dirty = useRef(false);
  const blocked = useRef(false);
  const running = useRef<Promise<boolean> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const onSavedRef = useRef(onSaved);
  const retry = useRef<() => void>(() => {});
  useEffect(() => {
    onSavedRef.current = onSaved;
  });

  const runOnce = useCallback(async (): Promise<boolean> => {
    const snapshot = latest.current;
    dirty.current = false;
    setStatus({ kind: "saving" });
    let res: Awaited<ReturnType<typeof saveDraft>>;
    try {
      res = await saveDraft({ stopId, version: version.current, content: snapshot });
    } catch {
      dirty.current = true;
      setStatus({ kind: "error", message: "Couldn't reach the server.", retrying: true });
      timer.current = setTimeout(() => retry.current(), RETRY);
      return false;
    }
    if (res.status === "saved") {
      version.current = res.version;
      onSavedRef.current();
      if (!dirty.current) {
        localStorage.removeItem(backupKey(stopId));
        setStatus({ kind: "saved", at: res.savedAt });
      }
      return true;
    }
    dirty.current = true;
    if (res.status === "conflict") {
      blocked.current = true;
      setStatus({ kind: "conflict", conflict: res });
    } else if (res.status === "signed-out") {
      blocked.current = true;
      setStatus({ kind: "signed-out" });
    } else {
      setStatus({ kind: "error", message: res.message, retrying: false });
    }
    return false;
  }, [stopId]);

  /** Saves now if anything is unsaved. Resolves to whether everything is saved. */
  const save = useCallback(async (): Promise<boolean> => {
    clearTimeout(timer.current);
    while (running.current) await running.current;
    while (dirty.current) {
      if (blocked.current) return false;
      running.current = runOnce();
      const ok = await running.current;
      running.current = null;
      if (!ok) return false;
    }
    return true;
  }, [runOnce]);
  useEffect(() => {
    retry.current = () => void save();
  }, [save]);

  // Called for every edit made in this tab.
  const changed = useCallback(
    (next: StopContent) => {
      latest.current = next;
      dirty.current = true;
      try {
        const backup: Backup = { version: version.current, content: next, at: new Date().toISOString() };
        localStorage.setItem(backupKey(stopId), JSON.stringify(backup));
      } catch {
        // Storage full or disabled: the server copy still gets saved.
      }
      if (blocked.current) return;
      setStatus({ kind: "unsaved" });
      clearTimeout(timer.current);
      timer.current = setTimeout(() => void save(), DELAY);
    },
    [save, stopId],
  );

  /** For content that came from the server (restore, discard): nothing to save. */
  const reset = useCallback(
    (next: StopContent, nextVersion: number) => {
      clearTimeout(timer.current);
      latest.current = next;
      version.current = nextVersion;
      dirty.current = false;
      blocked.current = false;
      localStorage.removeItem(backupKey(stopId));
      setStatus({ kind: "idle" });
    },
    [stopId],
  );

  /** After a conflict: save this tab's copy over the other one. */
  const overwrite = useCallback(() => {
    if (status.kind !== "conflict") return;
    version.current = status.conflict.version;
    blocked.current = false;
    dirty.current = true;
    void save();
  }, [status, save]);

  /** After an action that bumped the version itself, such as publishing. */
  const setVersion = useCallback((v: number) => {
    version.current = v;
  }, []);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty.current || running.current) e.preventDefault();
    };
    const hidden = () => {
      if (document.visibilityState === "hidden") void save();
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [save]);

  // Leaving the page inside the app (another stop, the map): send what's left.
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      if (dirty.current && !blocked.current) void save();
    },
    [save],
  );

  return {
    status,
    changed,
    save,
    reset,
    overwrite,
    setVersion,
    version: () => version.current,
    isDirty: () => dirty.current || !!running.current,
  };
}
