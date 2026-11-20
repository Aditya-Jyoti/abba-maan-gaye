"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type ElementType, type KeyboardEvent } from "react";
import { inlineToHtml, serializeInline, type Run } from "@/lib/inline";
import styles from "./editor.module.css";

type Props = {
  value: string;
  onChange: (value: string) => void;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  /** Allow bold and italic (Cmd/Ctrl+B, Cmd/Ctrl+I). */
  rich?: boolean;
  /** Allow line breaks with Shift+Enter. */
  multiline?: boolean;
  placeholder?: string;
  /** Accessible name, shown to screen readers. */
  label: string;
  /** Enter splits the text at the caret; this gets both halves. */
  onSplit?: (before: string, after: string) => void;
  /** Backspace in an empty field. */
  onRemoveEmpty?: () => void;
};

/** Collects the text in an editable element as runs, reading only bold, italic and line breaks. */
function readRuns(root: Node): Run[] {
  const runs: Run[] = [];
  const walk = (node: Node, bold: boolean, italic: boolean) => {
    node.childNodes.forEach((child, i) => {
      if (child.nodeType === Node.TEXT_NODE) {
        runs.push({ text: (child.textContent ?? "").replace(/\u00a0/g, " "), bold, italic });
        return;
      }
      if (!(child instanceof HTMLElement)) return;
      const tag = child.tagName;
      if (tag === "BR") {
        runs.push({ text: "\n", bold: false, italic: false });
        return;
      }
      // Browsers sometimes wrap new lines in blocks instead of using <br>.
      if ((tag === "DIV" || tag === "P") && i > 0) runs.push({ text: "\n", bold: false, italic: false });
      const weight = child.style.fontWeight;
      const b = bold || tag === "B" || tag === "STRONG" || weight === "bold" || Number(weight) >= 600;
      const it = italic || tag === "I" || tag === "EM" || child.style.fontStyle === "italic";
      walk(child, b, it);
    });
  };
  walk(root, false, false);
  return runs;
}

function read(el: Node, rich: boolean, multiline: boolean): string {
  const runs = readRuns(el);
  let text = rich ? serializeInline(runs) : runs.map((r) => r.text).join("");
  // A lone trailing <br> is the browser keeping an empty last line open.
  text = text.replace(/\n+$/, "");
  return multiline ? text : text.replace(/\n/g, " ");
}

function placeCaret(el: HTMLElement, atStart: boolean) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(atStart);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

export function focusEditable(el: HTMLElement | null | undefined, at: "start" | "end") {
  if (!el) return;
  el.focus();
  placeCaret(el, at === "start");
}

/**
 * Text that is edited where it appears on the page. The DOM is the source of truth
 * while typing; it's only rewritten when `value` changes from outside, such as
 * after restoring an older version.
 */
export function EditableText({
  value,
  onChange,
  as: Tag = "div",
  className,
  style,
  rich = false,
  multiline = false,
  placeholder,
  label,
  onSplit,
  onRemoveEmpty,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const shown = useRef(value);
  const [initialHtml] = useState(() => ({ __html: inlineToHtml(value, rich) }));

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || value === shown.current) return;
    shown.current = value;
    el.innerHTML = inlineToHtml(value, rich);
  }, [value, rich]);

  const emit = () => {
    const el = ref.current;
    if (!el) return;
    const next = read(el, rich, multiline);
    // Keep :empty (and so the placeholder) working once everything is deleted.
    if (!next && el.innerHTML) el.innerHTML = "";
    if (next === shown.current) return;
    shown.current = next;
    onChange(next);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const el = ref.current!;
    const mod = e.metaKey || e.ctrlKey;
    if (mod && (e.key === "b" || e.key === "i" || e.key === "u")) {
      e.preventDefault();
      if (rich && e.key !== "u") document.execCommand(e.key === "b" ? "bold" : "italic");
      return;
    }
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (multiline && e.shiftKey) {
        document.execCommand("insertLineBreak");
        return;
      }
      if (!onSplit) return;
      const sel = window.getSelection();
      if (!sel?.rangeCount) return;
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const tail = document.createRange();
      tail.setStart(range.endContainer, range.endOffset);
      tail.setEnd(el, el.childNodes.length);
      const holder = document.createElement("div");
      holder.append(tail.extractContents());
      const before = read(el, rich, multiline);
      shown.current = before;
      if (!before) el.innerHTML = "";
      onSplit(before, read(holder, rich, multiline));
      return;
    }
    if (e.key === "Backspace" && onRemoveEmpty && !el.textContent) {
      e.preventDefault();
      onRemoveEmpty();
    }
  };

  return (
    <Tag
      ref={ref}
      className={className ? `${styles.editable} ${className}` : styles.editable}
      style={style}
      contentEditable={rich ? true : "plaintext-only"}
      role="textbox"
      aria-label={label}
      aria-multiline={multiline || !!onSplit}
      data-placeholder={placeholder}
      spellCheck
      dangerouslySetInnerHTML={initialHtml}
      onInput={emit}
      onBlur={emit}
      onKeyDown={onKeyDown}
      onPaste={(e: React.ClipboardEvent) => {
        // Paste as plain text so no outside formatting or markup gets in.
        e.preventDefault();
        let text = e.clipboardData.getData("text/plain").replace(/\r\n?/g, "\n");
        if (!multiline) text = text.replace(/\n+/g, " ");
        document.execCommand("insertText", false, text);
      }}
      onDrop={(e: React.DragEvent) => {
        // Files dropped on text would otherwise be inserted as HTML.
        if (e.dataTransfer.types.includes("Files")) e.preventDefault();
      }}
    />
  );
}
