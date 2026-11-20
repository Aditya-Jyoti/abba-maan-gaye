"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { StopArticle } from "@/components/blog/StopArticle";
import { rememberScroll, RestoreScroll } from "@/components/blog/KeepScroll";
import type { ImageRef, StopContent, StoryBlock } from "@/db/schema";
import type { Viewer } from "@/lib/auth/session";
import { publishStop } from "@/lib/cms/actions";
import { convertBlock, emptyBlock } from "@/lib/cms/content";
import type { EditorStop } from "@/lib/cms/queries";
import { homeHref, stopHref } from "@/lib/routes";
import { uploadImage, type EditApi, type Path } from "./api";
import styles from "./editor.module.css";
import { focusEditable } from "./EditableText";
import { HistoryPanel } from "./HistoryPanel";
import { SettingsPanel } from "./SettingsPanel";
import { ago } from "./time";
import { backupKey, useAutosave, type Backup, type SaveStatus } from "./useAutosave";

type State = { content: StopContent; ids: string[] };

let nextId = 0;
const newId = () => `b${++nextId}`;

function setIn(target: unknown, path: Path, fn: (v: unknown) => unknown): unknown {
  if (!path.length) return fn(target);
  const [key, ...rest] = path;
  const copy = (Array.isArray(target) ? [...target] : { ...(target as object) }) as Record<string | number, unknown>;
  copy[key] = setIn(copy[key], rest, fn);
  return copy;
}

const asList = (v: unknown) => (Array.isArray(v) ? v : []) as unknown[];
const insertAt = <T,>(list: T[], i: number, item: T) => [...list.slice(0, i), item, ...list.slice(i)];
const removeAt = <T,>(list: T[], i: number) => list.filter((_, j) => j !== i);
function moveTo<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length || from === to) return list;
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}
const isStory = (path: Path) => path.length === 1 && path[0] === "story";

type Panel = "settings" | "history" | null;

export function StopEditor({ data, viewer }: { data: EditorStop; viewer: Viewer }) {
  const router = useRouter();
  const [state, setState] = useState<State>(() => ({ content: data.content, ids: data.content.story.map(newId) }));
  const [hasDraft, setHasDraft] = useState(data.hasDraft);
  const [published, setPublished] = useState(data.published);
  const [preview, setPreview] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const [backup, setBackup] = useState<Backup | null>(null);
  const [publishing, startPublish] = useTransition();
  const focusNext = useRef<{ id: string; at: "start" | "end" } | null>(null);

  const autosave = useAutosave(data.stopId, data.version, state.content, () => setHasDraft(true));
  const { changed } = autosave;

  const notify = useCallback((text: string, error = false) => setToast({ text, error }), []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.error ? 7000 : 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Offer back anything this browser didn't manage to save last time.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(backupKey(data.stopId));
      if (!raw) return;
      const b = JSON.parse(raw) as Backup;
      if (JSON.stringify(b.content) === JSON.stringify(data.content)) {
        localStorage.removeItem(backupKey(data.stopId));
        return;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBackup(b);
    } catch {
      localStorage.removeItem(backupKey(data.stopId));
    }
  }, [data.stopId, data.content]);

  const update = useCallback((fn: (s: State) => State) => setState(fn), []);

  // Every change to the content made here gets autosaved; content loaded from the server doesn't.
  const synced = useRef(state.content);
  useEffect(() => {
    if (state.content === synced.current) return;
    synced.current = state.content;
    changed(state.content);
  }, [state.content, changed]);

  const upload = useCallback(
    async (files: File[]) => {
      const done: ImageRef[] = [];
      for (const file of files) {
        try {
          done.push(await uploadImage(file));
        } catch (err) {
          notify(`${file.name}: ${err instanceof Error ? err.message : "upload failed"}`, true);
        }
      }
      return done;
    },
    [notify],
  );

  const edit: EditApi = useMemo(
    () => ({
      blockIds: state.ids,
      set: (path, value) => update((s) => ({ ...s, content: setIn(s.content, path, () => value) as StopContent })),
      insert: (path, i, item) =>
        update((s) => ({
          content: setIn(s.content, path, (l) => insertAt(asList(l), i, item)) as StopContent,
          ids: isStory(path) ? insertAt(s.ids, i, newId()) : s.ids,
        })),
      remove: (path, i) =>
        update((s) => ({
          content: setIn(s.content, path, (l) => removeAt(asList(l), i)) as StopContent,
          ids: isStory(path) ? removeAt(s.ids, i) : s.ids,
        })),
      move: (path, from, to) =>
        update((s) => ({
          content: setIn(s.content, path, (l) => moveTo(asList(l), from, to)) as StopContent,
          ids: isStory(path) ? moveTo(s.ids, from, to) : s.ids,
        })),
      addBlock: (i, type) => {
        const id = newId();
        focusNext.current = { id, at: "start" };
        update((s) => ({
          content: { ...s.content, story: insertAt(s.content.story, i, emptyBlock(type)) },
          ids: insertAt(s.ids, i, id),
        }));
      },
      convertBlock: (i, type) =>
        update((s) => ({
          ...s,
          content: { ...s.content, story: s.content.story.map((b, j) => (j === i ? convertBlock(b, type) : b)) },
        })),
      splitBlock: (i, before, after) => {
        const id = newId();
        focusNext.current = { id, at: "start" };
        update((s) => {
          const story = [...s.content.story];
          story[i] = { ...(story[i] as Extract<StoryBlock, { type: "p" }>), text: before };
          return {
            content: { ...s.content, story: insertAt(story, i + 1, { type: "p", text: after } as StoryBlock) },
            ids: insertAt(s.ids, i + 1, id),
          };
        });
      },
      removeEmptyBlock: (i) => {
        if (i > 0) focusNext.current = { id: state.ids[i - 1], at: "end" };
        update((s) => ({
          content: { ...s.content, story: removeAt(s.content.story, i) },
          ids: removeAt(s.ids, i),
        }));
      },
      upload,
    }),
    [state.ids, update, upload],
  );

  // Put the caret in a block that was just added, split off, or moved back to.
  useEffect(() => {
    const f = focusNext.current;
    if (!f) return;
    focusNext.current = null;
    const fields = document.querySelectorAll<HTMLElement>(`[data-block="${f.id}"] [role="textbox"]`);
    const main = [...fields].filter((el) => el.getAttribute("aria-multiline") === "true");
    const pick = f.at === "start" ? fields[0] : (main.at(-1) ?? fields[fields.length - 1]);
    focusEditable(pick, f.at);
  });

  const restoreContent = useCallback(
    (content: StopContent, version: number, draft: boolean) => {
      autosave.reset(content, version);
      synced.current = content;
      setState({ content, ids: content.story.map(newId) });
      setHasDraft(draft);
    },
    [autosave],
  );

  const publish = () =>
    startPublish(async () => {
      if (!(await autosave.save())) {
        notify("Save your changes before publishing: see the message in the bar.", true);
        return;
      }
      const res = await publishStop({ stopId: data.stopId, version: autosave.version() });
      if (res.status === "published") {
        autosave.setVersion(res.version);
        setHasDraft(false);
        setPublished(true);
        notify(data.tripPublished ? "Published. It's live on the site now." : "Published, and the trip is now on the map.");
      } else if (res.status === "conflict") {
        notify(`${res.by ?? "Someone"} changed this stop since you opened it. Reload to see their version first.`, true);
      } else if (res.status === "signed-out") {
        notify("Your session has ended. Log in again in another tab, then publish.", true);
      } else {
        notify(res.message, true);
      }
    });

  const done = async () => {
    await autosave.save();
    if (published) {
      const href = stopHref(data.page.trip.slug, data.page.stop.slug);
      rememberScroll(href);
      router.push(href, { scroll: false });
    } else {
      router.push(homeHref);
    }
  };

  const page = useMemo(
    () => ({ ...data.page, stop: { ...data.page.stop, ...state.content, title: preview ? state.content.title || data.page.stop.name : state.content.title } }),
    [data.page, state.content, preview],
  );

  const pending = hasDraft || !["idle", "saved"].includes(autosave.status.kind);

  const bar = (
    <div className={styles.bar} role="region" aria-label="Editor">
      <RestoreScroll />
      <SaveState status={autosave.status} hasDraft={hasDraft} published={published} />
      <div className={styles.barButtons}>
        <button type="button" className={styles.barButton} aria-pressed={preview} onClick={() => setPreview((p) => !p)}>
          {preview ? "Back to editing" : "Preview"}
        </button>
        <button type="button" className={styles.barButton} aria-expanded={panel === "history"} onClick={() => setPanel(panel === "history" ? null : "history")}>
          Versions
        </button>
        <button type="button" className={styles.barButton} aria-expanded={panel === "settings"} onClick={() => setPanel(panel === "settings" ? null : "settings")}>
          Settings
        </button>
        <button
          type="button"
          className={styles.publish}
          onClick={publish}
          disabled={publishing || (published && !pending)}
        >
          {publishing ? "Publishing..." : published ? (pending ? "Publish changes" : "Published") : "Publish"}
        </button>
        <button type="button" className={styles.done} onClick={done}>
          Done
        </button>
      </div>
    </div>
  );

  return (
    <>
      <StopArticle page={page} viewer={viewer} edit={preview ? undefined : edit} bar={bar} />

      {autosave.status.kind === "conflict" && (
        <div className={styles.banner} role="alert">
          <p>
            <strong>{autosave.status.conflict.by ?? "Someone"}</strong> saved this stop
            {autosave.status.conflict.at ? ` ${ago(autosave.status.conflict.at)}` : ""}, after you opened it. Your latest edits here
            haven&apos;t been saved.
          </p>
          <div className={styles.bannerButtons}>
            <button type="button" className={styles.chip} onClick={() => window.location.reload()}>
              Load their version
            </button>
            <button type="button" className={styles.chipDanger} onClick={autosave.overwrite}>
              Keep mine (replaces theirs)
            </button>
          </div>
        </div>
      )}
      {autosave.status.kind === "signed-out" && (
        <div className={styles.banner} role="alert">
          <p>Your session has ended, so changes can&apos;t be saved. They&apos;re kept in this browser: log in again and they&apos;ll be offered back.</p>
          <div className={styles.bannerButtons}>
            <a className={styles.chip} href={`/login?next=${encodeURIComponent(window.location.pathname)}`}>
              Log in again
            </a>
          </div>
        </div>
      )}
      {backup && (
        <div className={styles.banner} role="alert">
          <p>This browser has changes to this stop from {ago(backup.at)} that never reached the server.</p>
          <div className={styles.bannerButtons}>
            <button
              type="button"
              className={styles.chip}
              onClick={() => {
                setBackup(null);
                setState({ content: backup.content, ids: backup.content.story.map(newId) });
              }}
            >
              Bring them back
            </button>
            <button
              type="button"
              className={styles.chipQuiet}
              onClick={() => {
                localStorage.removeItem(backupKey(data.stopId));
                setBackup(null);
              }}
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {panel === "settings" && (
        <SettingsPanel data={data} published={published} viewer={viewer} flush={autosave.save} onClose={() => setPanel(null)} notify={notify} onUnpublished={() => setPublished(false)} />
      )}
      {panel === "history" && (
        <HistoryPanel
          stopId={data.stopId}
          hasDraft={hasDraft}
          published={published}
          flush={autosave.save}
          version={autosave.version}
          onClose={() => setPanel(null)}
          onContent={restoreContent}
          notify={notify}
        />
      )}

      {toast && (
        <div className={toast.error ? styles.toastError : styles.toast} role="status">
          {toast.text}
        </div>
      )}
    </>
  );
}

function SaveState({ status, hasDraft, published }: { status: SaveStatus; hasDraft: boolean; published: boolean }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  let text: string;
  let tone = styles.dotOk;
  switch (status.kind) {
    case "unsaved":
      text = "Unsaved changes";
      tone = styles.dotBusy;
      break;
    case "saving":
      text = "Saving...";
      tone = styles.dotBusy;
      break;
    case "saved":
      text = `Draft saved ${ago(status.at)}`;
      break;
    case "error":
      text = status.retrying ? `${status.message} Retrying...` : `Not saved: ${status.message}`;
      tone = styles.dotError;
      break;
    case "conflict":
      text = "Not saved: edited elsewhere";
      tone = styles.dotError;
      break;
    case "signed-out":
      text = "Not saved: logged out";
      tone = styles.dotError;
      break;
    default:
      text = hasDraft ? "Draft, not published yet" : published ? "Live, no changes" : "Not published";
  }
  return (
    <span className={styles.saveState} aria-live="polite">
      <span className={`${styles.dot} ${tone}`} />
      {text}
    </span>
  );
}
