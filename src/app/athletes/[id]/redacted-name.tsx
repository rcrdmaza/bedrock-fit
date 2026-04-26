// Visual treatment for the name on a private profile when the visitor
// isn't the owner. Renders the first word of the display name with a
// strikethrough, followed by a black redaction bar that masks where the
// rest of the name would be — the goal is "you can tell something is
// here, but you can't tell what."
//
// Server component on purpose — no interactivity, no state, just SVG +
// CSS. Keeping it out of the client bundle makes the private-profile
// path no heavier than the public one.

interface Props {
  // Full display name (already resolved through getDisplayName). We
  // peel off the first whitespace-delimited token to render verbatim
  // and use the remaining length as a hint for how wide the redaction
  // bar should be.
  name: string;
  // Optional className override for the wrapper. The profile header
  // currently uses 3xl/font-semibold; pass the same classes through so
  // the redacted version replaces the heading without shifting layout.
  className?: string;
}

export default function RedactedName({ name, className }: Props) {
  const trimmed = name.trim();
  // Split into [first, ...rest]. If the name is a single word we still
  // show a redaction bar to imply "more is hidden" — feels less honest
  // than blanking the whole header.
  const firstSpace = trimmed.indexOf(' ');
  const visible = firstSpace === -1 ? trimmed : trimmed.slice(0, firstSpace);
  const remainderLength =
    firstSpace === -1 ? 6 : Math.max(4, trimmed.length - firstSpace - 1);

  // Width of the bar scales with the redacted character count. We use
  // an em-based unit so the bar visually tracks the surrounding font
  // size — tighter than a fixed pixel width when the heading is large.
  const barWidthEm = Math.min(8, remainderLength * 0.55);

  return (
    <span
      className={`inline-flex items-baseline gap-2 ${className ?? ''}`}
      aria-label="Name hidden — this profile is private"
    >
      <span className="line-through text-stone-900">{visible}</span>
      <span
        aria-hidden="true"
        className="inline-block h-[0.7em] rounded-sm bg-stone-900"
        style={{ width: `${barWidthEm}em` }}
      />
    </span>
  );
}
