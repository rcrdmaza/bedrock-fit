// Event-photo upload validation + encoding. Lives next to lib/avatar.ts
// because the shape is intentionally identical — same MIME allowlist,
// same Blob-like contract, same data-URL output — but we keep them
// separate so the size caps can drift independently. Avatars are
// thumbnails (200 KB is generous); event photos drive the home-page
// carousel and need real resolution to not look hideous, so we allow
// up to 2 MB.
//
// Storing the bytes as a base64 data: URL inside the existing `url`
// column is intentional. Two reasons:
//
//   1. The carousel + photo grid already render `<img src={p.url}>`,
//      so a data URL needs zero render-side changes.
//   2. We don't have object storage yet. Putting 2 MB strings in
//      Postgres TEXT is fine for the early-stage volume the site
//      handles; when traffic warrants it, a follow-up can swap to S3
//      / R2 / Railway volumes by replacing this validator's output
//      with an upload-then-return-public-URL flow without touching
//      the schema or any consumers.
//
// SVGs are deliberately excluded — an `<img src>` of an SVG can carry
// arbitrary embedded HTML/JS via `<foreignObject>`, and our admin
// surface is the only place these come from but defense-in-depth
// is cheap here.

const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2 MB

const ALLOWED_PHOTO_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

export type EventPhotoValidation =
  | { ok: true; dataUrl: string; bytes: number; mime: string }
  | { ok: false; error: 'fileTooLarge' | 'fileWrongType' | 'fileEmpty' };

// Same Blob-like surface as avatar.ts — just enough for the runtime
// File the server action receives, plus a synthetic test fixture.
export interface BlobLike {
  size: number;
  type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export async function validateEventPhotoFile(
  file: BlobLike,
): Promise<EventPhotoValidation> {
  // Cheap rejections first. We check size before reading the buffer so
  // a 50 MB drag-and-drop doesn't get streamed through fully before we
  // bail. Next's serverActions.bodySizeLimit (6 MB) is the outer
  // backstop — this is the inner one that gives a useful error rather
  // than a blanket framework-level 413.
  if (file.size === 0) {
    return { ok: false, error: 'fileEmpty' };
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return { ok: false, error: 'fileTooLarge' };
  }

  // Browsers occasionally send "image/jpg" instead of "image/jpeg" for
  // a JPEG. Treat that as a typo so we don't reject a perfectly valid
  // upload over a one-letter MIME quirk.
  const mime = file.type === 'image/jpg' ? 'image/jpeg' : file.type;
  if (!ALLOWED_PHOTO_MIME.has(mime)) {
    return { ok: false, error: 'fileWrongType' };
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const base64 = buf.toString('base64');
  return {
    ok: true,
    mime,
    bytes: file.size,
    dataUrl: `data:${mime};base64,${base64}`,
  };
}

// Exported so the photo-manager UI can render the cap in helper text
// without duplicating the magic number. Keep these two in sync with
// the validator above.
export const EVENT_PHOTO_LIMITS = {
  maxBytes: MAX_PHOTO_BYTES,
  maxMb: MAX_PHOTO_BYTES / 1024 / 1024,
  allowedMime: ALLOWED_PHOTO_MIME,
} as const;
