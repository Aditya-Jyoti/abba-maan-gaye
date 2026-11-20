"use client";

import { useEffect, useRef, useState } from "react";
import { BLOCK_TYPES, type BlockType } from "@/lib/cms/content";
import styles from "./editor.module.css";

type ToolsProps = {
  /** What the item is called in button labels, e.g. "block" or "photo". */
  noun: string;
  index: number;
  count: number;
  onMove: (to: number) => void;
  onRemove: () => void;
  /** Horizontal lists move left and right instead of up and down. */
  sideways?: boolean;
  /** For story blocks: switch to another layout. */
  type?: BlockType;
  onConvert?: (type: BlockType) => void;
};

/** Move and delete buttons that appear on an item while it's hovered or focused. */
export function ItemTools({ noun, index, count, onMove, onRemove, sideways, type, onConvert }: ToolsProps) {
  return (
    <div className={styles.tools} role="toolbar" aria-label={`${noun} ${index + 1} tools`}>
      {type && onConvert && (
        <select
          className={styles.toolSelect}
          value={type}
          onChange={(e) => onConvert(e.target.value as BlockType)}
          aria-label="Block layout"
        >
          {BLOCK_TYPES.map((b) => (
            <option key={b.type} value={b.type}>
              {b.label}
            </option>
          ))}
        </select>
      )}
      <button
        type="button"
        className={styles.tool}
        disabled={index === 0}
        onClick={() => onMove(index - 1)}
        aria-label={`Move ${noun} ${sideways ? "left" : "up"}`}
        title={`Move ${sideways ? "left" : "up"}`}
      >
        {sideways ? "\u2190" : "\u2191"}
      </button>
      <button
        type="button"
        className={styles.tool}
        disabled={index === count - 1}
        onClick={() => onMove(index + 1)}
        aria-label={`Move ${noun} ${sideways ? "right" : "down"}`}
        title={`Move ${sideways ? "right" : "down"}`}
      >
        {sideways ? "\u2192" : "\u2193"}
      </button>
      <button
        type="button"
        className={`${styles.tool} ${styles.toolDanger}`}
        onClick={onRemove}
        aria-label={`Delete ${noun}`}
        title="Delete"
      >
        {"\u00d7"}
      </button>
    </div>
  );
}

/** A "+" between story blocks that opens a menu of block layouts. */
export function Inserter({ onPick, always = false }: { onPick: (type: BlockType) => void; always?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={ref} data-inserter className={`${styles.inserter} ${always ? styles.inserterEnd : ""} ${always || open ? styles.inserterShown : ""}`}>
      <button
        type="button"
        className={styles.inserterButton}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Add a block here"
      >
        + Add block
      </button>
      {open && (
        <div className={styles.menu} role="menu">
          {BLOCK_TYPES.map((b) => (
            <button
              key={b.type}
              type="button"
              role="menuitem"
              className={styles.menuItem}
              onClick={() => {
                setOpen(false);
                onPick(b.type);
              }}
            >
              {b.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** A dashed button for adding an item to a list. */
export function AddButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" className={styles.addButton} onClick={onClick}>
      + {children}
    </button>
  );
}
