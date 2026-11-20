"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./editor.module.css";

/** A panel that slides in from the right. Escape or the close button dismisses it. */
export function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [onClose]);
  return (
    <aside ref={ref} className={styles.drawer} role="dialog" aria-label={title} tabIndex={-1}>
      <div className={styles.drawerHead}>
        <h2 className={styles.drawerTitle}>{title}</h2>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
          {"\u00d7"}
        </button>
      </div>
      <div className={styles.drawerBody}>{children}</div>
    </aside>
  );
}
