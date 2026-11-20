// Inline formatting for post text. Stored as plain strings with a small markup:
// `**` switches bold on or off, `*` switches italic, `\` escapes the next
// character, and newlines are line breaks. Keep this file free of imports: the
// tests load it directly with Node.

export type Run = { text: string; bold: boolean; italic: boolean };

/** Splits marked-up text into runs of the same style. Unclosed markers run to the end. */
export function parseInline(src: string): Run[] {
  const runs: Run[] = [];
  let bold = false;
  let italic = false;
  let text = "";
  const flush = () => {
    if (text) runs.push({ text, bold, italic });
    text = "";
  };
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === "\\" && i + 1 < src.length) {
      text += src[++i];
    } else if (c === "*" && src[i + 1] === "*") {
      flush();
      bold = !bold;
      i++;
    } else if (c === "*") {
      flush();
      italic = !italic;
    } else {
      text += c;
    }
  }
  flush();
  return runs;
}

const escapeText = (s: string) => s.replace(/[\\*]/g, (c) => `\\${c}`);

/** The inverse of parseInline. Adjacent runs with the same style are merged. */
export function serializeInline(runs: Run[]): string {
  let out = "";
  let bold = false;
  let italic = false;
  for (const r of runs) {
    if (!r.text) continue;
    // Line breaks never carry style, which keeps markers off the ends of lines.
    const b = r.bold && r.text.trim() !== "";
    const it = r.italic && r.text.trim() !== "";
    if (b !== bold) {
      out += "**";
      bold = b;
    }
    if (it !== italic) {
      out += "*";
      italic = it;
    }
    out += escapeText(r.text);
  }
  if (bold) out += "**";
  if (italic) out += "*";
  return out;
}

/** The text with formatting removed, e.g. for page descriptions. */
export const plainText = (src: string) =>
  parseInline(src)
    .map((r) => r.text)
    .join("");

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** HTML for the in-place editor. Only <b>, <i> and <br> are produced; all text is escaped. */
export function inlineToHtml(src: string, rich: boolean): string {
  const runs = rich ? parseInline(src) : [{ text: src, bold: false, italic: false }];
  return runs
    .map((r) => {
      let h = escapeHtml(r.text).replace(/\n/g, "<br>");
      if (r.italic) h = `<i>${h}</i>`;
      if (r.bold) h = `<b>${h}</b>`;
      return h;
    })
    .join("");
}
