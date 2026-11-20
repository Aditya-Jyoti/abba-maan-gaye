import { Fragment } from "react";
import { parseInline } from "@/lib/inline";

/** Renders post text with its bold, italic and line-break markup. */
export function InlineText({ text }: { text: string }) {
  return parseInline(text).map((r, i) => {
    const lines = r.text.split("\n");
    let node: React.ReactNode = lines.map((line, j) => (
      <Fragment key={j}>
        {j > 0 && <br />}
        {line}
      </Fragment>
    ));
    if (r.italic) node = <em>{node}</em>;
    if (r.bold) node = <strong>{node}</strong>;
    return <Fragment key={i}>{node}</Fragment>;
  });
}
