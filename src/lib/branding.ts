// Logo + favicon upload validation. Mirrors event-photo / avatar
// validators in shape — same BlobLike contract, same data-URL output,
// same {ok, error} return — so the two new server actions feel
// identical to the existing ones.
//
// Two reasons we split this into its own file rather than reusing the
// event-photo validator:
//   1. Caps are intentionally different. Header logos must stay light
//      because they ride in the SSR HTML on every page request; we
//      pick 500 KB as a hard ceiling so even a worst-case render adds
//      under a megabyte of branding bytes. Favicons live in the same
//      HTML head as a `<link rel="icon" href="data:…">`, so we keep
//      them even smaller — 100 KB is generous for a 64×64 ICO/PNG.
//   2. SVG is allowed here but not for event photos. Brand assets are
//      genuinely better as vectors (scale crisp at any DPR / display
//      size), and the only place this SVG is ever rendered is inside
//      an `<img src>` or a `<link rel="icon">` — both surfaces sandbox
//      embedded scripts in modern browsers, so the usual "SVGs can
//      carry JS" concern doesn't apply to us.

export const LOGO_LIMITS = {
  maxBytes: 500 * 1024, // 500 KB
  maxKb: 500,
  recommendedHeightPx: 40,
  recommendedWidthPx: 200,
  recommendedMaxWidthPx: 400,
  acceptedMime: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'] as const,
} as const;

export const FAVICON_LIMITS = {
  maxBytes: 100 * 1024, // 100 KB
  maxKb: 100,
  recommendedSizePx: 64,
  recommendedMinSizePx: 32,
  recommendedMaxSizePx: 256,
  acceptedMime: [
    'image/png',
    'image/x-icon',
    'image/vnd.microsoft.icon', // some browsers report this for .ico
    'image/svg+xml',
  ] as const,
} as const;

export type BrandingValidation =
  | { ok: true; dataUrl: string; bytes: number; mime: string }
  | { ok: false; error: 'fileTooLarge' | 'fileWrongType' | 'fileEmpty' };

// Same Blob-like surface the rest of the validators use. Just enough
// of File so we don't bind to the runtime DOM type and can unit-test
// with synthetic fixtures.
export interface BlobLike {
  size: number;
  type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
}

async function validate(
  file: BlobLike,
  acceptedMime: readonly string[],
  maxBytes: number,
): Promise<BrandingValidation> {
  if (file.size === 0) {
    return { ok: false, error: 'fileEmpty' };
  }
  if (file.size > maxBytes) {
    return { ok: false, error: 'fileTooLarge' };
  }

  // Same JPEG/JPG quirk fix as event-photo.
  const mime = file.type === 'image/jpg' ? 'image/jpeg' : file.type;
  if (!acceptedMime.includes(mime)) {
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

export function validateLogoFile(file: BlobLike): Promise<BrandingValidation> {
  return validate(file, LOGO_LIMITS.acceptedMime, LOGO_LIMITS.maxBytes);
}

export function validateFaviconFile(
  file: BlobLike,
): Promise<BrandingValidation> {
  return validate(file, FAVICON_LIMITS.acceptedMime, FAVICON_LIMITS.maxBytes);
}

// Human-readable error reason for surfacing in the admin UI. Kept here
// so a future copy edit doesn't have to thread through three layers.
export function brandingErrorMessage(
  kind: 'logo' | 'favicon',
  error: Exclude<BrandingValidation, { ok: true }>['error'],
): string {
  const limits = kind === 'logo' ? LOGO_LIMITS : FAVICON_LIMITS;
  if (error === 'fileEmpty') return 'No file selected.';
  if (error === 'fileTooLarge')
    return `File too large. Maximum ${limits.maxKb} KB.`;
  if (kind === 'logo') {
    return 'Unsupported format. Use PNG, JPEG, WebP, or SVG.';
  }
  return 'Unsupported format. Use PNG, ICO, or SVG.';
}
