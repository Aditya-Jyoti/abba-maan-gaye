"use client";

import { useEffect, useState, useTransition } from "react";
import type { StopContent } from "@/db/schema";
import { discardDraft, listRevisions, restoreRevision } from "@/lib/cms/actions";
import type { RevisionSummary } from "@/lib/cms/queries";
import { Drawer } from "./Drawer";
import styles from "./editor.module.css";
import { ago, dateTime } from "./time";

type Props = {
  stopId: string;
  hasDraft: boolean;
  published: boolean;
  /** Saves pending edits first; false if they couldn't be saved. */
  flush: () => Promise<boolean>;
  version: () => number;
  onClose: () => void;
  onContent: (content: StopContent, version: number, draft: boolean) => void;
  notify: (text: string, error?: boolean) => void;
};

/** The draft and every published version, with discard and restore. */
export function HistoryPanel({ stopId, hasDraft, published, flush, version, onClose, onContent, notify }: Props) {
  const [revisions, setRevisions] = useState<RevisionSummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, start] = useTransition();

  useEffect(() => {
    let live = true;
    listRevisions({ stopId })
      .then((res) => live && (Array.isArray(res) ? setRevisions(res) : setFailed(true)))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [stopId, published, hasDraft]);

  const run = (fn: (v: number) => ReturnType<typeof discardDraft>, done: string, draft: boolean) =>
    start(async () => {
      if (!(await flush())) {
        notify("Your latest edits haven't been saved yet, so nothing was changed.", true);
        return;
      }
      const res = await fn(version());
      if (res.status === "ok") {
        onContent(res.content, res.version, draft);
        notify(done);
      } else if (res.status === "conflict") {
        notify("Someone else changed this stop. Reload the page first.", true);
      } else if (res.status === "signed-out") {
        notify("Your session has ended. Log in again first.", true);
      } else {
        notify(res.message, true);
      }
    });

  return (
    <Drawer title="Versions" onClose={onClose}>
      <section className={styles.panelSection}>
        <h3 className={styles.panelHeading}>Draft</h3>
        {hasDraft ? (
          <>
            <p className={styles.panelText}>
              You have changes that aren&apos;t live yet. Visitors see the {published ? "published version" : "post only once it's published"}.
            </p>
            {published && (
              <button
                type="button"
                className={styles.chipDanger}
                disabled={busy}
                onClick={() => {
                  if (confirm("Throw away all unpublished changes to this stop?")) {
                    run((v) => discardDraft({ stopId, version: v }), "Draft discarded. You're looking at the live version.", false);
                  }
                }}
              >
                Discard draft
              </button>
            )}
          </>
        ) : (
          <p className={styles.panelText}>No unpublished changes.</p>
        )}
      </section>

      <section className={styles.panelSection}>
        <h3 className={styles.panelHeading}>Published versions</h3>
        {failed && <p className={styles.formError}>Couldn&apos;t load the history.</p>}
        {!revisions && !failed && <p className={styles.panelText}>Loading...</p>}
        {revisions?.length === 0 && (
          <p className={styles.panelText}>Nothing published from the editor yet. Each time you publish, the version is kept here.</p>
        )}
        <ol className={styles.revisions}>
          {revisions?.map((r, i) => (
            <li key={r.id} className={styles.revision}>
              <span>
                <span className={styles.revisionWhen} title={dateTime(r.publishedAt)}>
                  {ago(r.publishedAt)}
                </span>
                <span className={styles.revisionWho}>
                  {r.publishedBy ?? "A deleted editor"}
                  {i === 0 && published ? ", live now" : ""}
                </span>
              </span>
              <button
                type="button"
                className={styles.chip}
                disabled={busy}
                onClick={() => {
                  if (!hasDraft || confirm("This replaces your current draft. Continue?")) {
                    run(
                      (v) => restoreRevision({ stopId, revisionId: r.id, version: v }),
                      "That version is now your draft. Publish to make it live.",
                      true,
                    );
                  }
                }}
              >
                Restore
              </button>
            </li>
          ))}
        </ol>
      </section>
    </Drawer>
  );
}
