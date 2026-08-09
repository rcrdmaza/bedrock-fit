import { Fragment } from "react";
import { mono } from "../LightFrame";

/**
 * Renderer for the four-construct inline syntax used in article body copy:
 *
 *   **bold**  *italic*  [text](url)  [^3]
 *
 * Everything else in the string passes through untouched, which is why content
 * files use real typographic characters (’ “ ” –) rather than HTML entities.
 *
 * One pass, one regex, alternation ordered so the greedier patterns win:
 * `**` before `*`, and `[^n]` before `[text](url)` (they can't collide — a
 * footnote marker is never followed by a paren).
 */
const INLINE =
  /\*\*([^*]+)\*\*|\*([^*]+)\*|\[\^(\d+)\]|\[([^\]]+)\]\(([^)\s]+)\)/g;

/** Footnote marker. Links down to the source list; `scrollMarginTop` there clears the sticky nav. */
function Ref({ n }: { n: number }) {
  return (
    <a
      href={`#source-${n}`}
      aria-label={`Source ${n}`}
      style={{ font: `700 10px ${mono}`, color: "var(--green-dark)", textDecoration: "none", verticalAlign: "super", padding: "0 1px" }}
    >
      [{n}]
    </a>
  );
}

export function renderInline(text: string): React.ReactNode {
  const out: React.ReactNode[] = [];
  let cursor = 0;
  let key = 0;

  // `matchAll` on a /g regex gives every match with its index, so we can slice
  // the untouched text between matches without mutating lastIndex by hand.
  for (const m of text.matchAll(INLINE)) {
    const at = m.index;
    if (at > cursor) out.push(text.slice(cursor, at));

    const [full, bold, italic, footnote, linkText, linkUrl] = m;

    if (bold !== undefined) {
      out.push(<strong key={key++} style={{ fontWeight: 700, color: "var(--ink)" }}>{bold}</strong>);
    } else if (italic !== undefined) {
      out.push(<em key={key++}>{italic}</em>);
    } else if (footnote !== undefined) {
      out.push(<Ref key={key++} n={Number(footnote)} />);
    } else if (linkText !== undefined && linkUrl !== undefined) {
      const external = /^https?:\/\//.test(linkUrl);
      out.push(
        <a
          key={key++}
          href={linkUrl}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          style={{ color: "var(--green-dark)", textDecoration: "underline" }}
        >
          {linkText}
        </a>
      );
    }

    cursor = at + full.length;
  }

  if (cursor < text.length) out.push(text.slice(cursor));
  return out.map((node, i) => <Fragment key={i}>{node}</Fragment>);
}

/** Inline syntax stripped to plain text — for aria-labels, OG text and word counts. */
export function stripInline(text: string): string {
  return text
    .replace(/\[\^(\d+)\]/g, "")
    .replace(/\[([^\]]+)\]\([^)\s]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1");
}
