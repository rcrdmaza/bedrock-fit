// Avatar upload validation + encoding. Pure(ish): takes a Blob/File and
// returns either a successful data: URL or a human-readable error
// message, no side effects, no DB.
//
// Why a helper rather than doing this inline in the server action?
// File handling is the most failure-prone part of the upload flow —
// type sniffing, size cap, base64 encoding — and the action shouldn't
// need to grow tests for each of those branches. Keeping it here also
// means a future "upload via drag-drop on the profile page" route can
// reuse the same validator.
//
// We accept the common photo MIME types (PNG, JPEG, WebP, GIF). Anything
// else is rejected — a tampered request could send "image/svg+xml",
// which would let a hostile uploader inline arbitrary HTML/JS in the
// data URL we render with <img src>; modern browsers sandbox SVG-in-img,
// but it's not worth the surface area when the use case is profile
// pictures.

const MAX_AVATAR_BYTES = 200 * 1024; // 200 KB — keeps row size sane.

const ALLOWED_AVATAR_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

export type AvatarValidation =
  | { ok: true; dataUrl: string; bytes: number; mime: string }
  | { ok: false; error: string };

// Minimal Blob-like surface — enough for the runtime File object the
// server action receives, and for synthetic test fixtures.
export interface BlobLike {
  size: number;
  type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export async function validateAvatarFile(file: BlobLike): Promise<AvatarValidation> {
  // Size cap is checked before we touch the buffer so a 100MB upload
  // doesn't get fully read into memory before being rejected.
  if (file.size === 0) {
    return { ok: false, error: 'No image was selected.' };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return {
      ok: false,
      error: `Image is too large (max ${Math.round(MAX_AVATAR_BYTES / 1024)} KB).`,
    };
  }
  // Normalize the MIME — browsers sometimes send "image/jpg" for a
  // JPEG; treat that as a typo and remap. Everything else is checked
  // against the allowlist.
  const mime = file.type === 'image/jpg' ? 'image/jpeg' : file.type;
  if (!ALLOWED_AVATAR_MIME.has(mime)) {
    return {
      ok: false,
      error: 'Image must be a PNG, JPEG, WebP, or GIF.',
    };
  }

  // Read the bytes once, then base64-encode for the data: URL. We use
  // Buffer (Node-only) since this code is server-side; no need for the
  // ~3x slower btoa fallback.
  const buf = Buffer.from(await file.arrayBuffer());
  const base64 = buf.toString('base64');
  return {
    ok: true,
    mime,
    bytes: file.size,
    dataUrl: `data:${mime};base64,${base64}`,
  };
}

// Exported for tests + UI affordances (e.g. surfacing the cap in the
// settings-form helper text). Keep these in sync with the validator.
export const AVATAR_LIMITS = {
  maxBytes: MAX_AVATAR_BYTES,
  allowedMime: ALLOWED_AVATAR_MIME,
} as const;
