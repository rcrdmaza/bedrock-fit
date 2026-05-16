import { describe, expect, it } from 'vitest';
import {
  brandingErrorMessage,
  FAVICON_LIMITS,
  LOGO_LIMITS,
  validateFaviconFile,
  validateLogoFile,
  type BlobLike,
} from './branding';

// Tiny in-memory File-shape factory so tests don't depend on Node's
// File or the DOM Blob. Mirrors the helper in event-photo.test.ts —
// the validator only reads size + MIME, then base64-encodes whatever
// bytes are there, so any payload of the requested length is fine.
function file(size: number, type: string): BlobLike {
  return {
    size,
    type,
    async arrayBuffer() {
      return new Uint8Array(size).buffer;
    },
  };
}

describe('validateLogoFile', () => {
  it('accepts a small PNG and emits a data URL', async () => {
    const r = await validateLogoFile(file(4, 'image/png'));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.dataUrl.startsWith('data:image/png;base64,')).toBe(true);
      expect(r.mime).toBe('image/png');
    }
  });

  it('accepts SVG (vector logos are the common case)', async () => {
    const r = await validateLogoFile(file(4, 'image/svg+xml'));
    expect(r.ok).toBe(true);
  });

  it('rejects an empty upload', async () => {
    const r = await validateLogoFile(file(0, 'image/png'));
    expect(r).toEqual({ ok: false, error: 'fileEmpty' });
  });

  it('rejects files larger than the logo cap', async () => {
    // One byte over the limit is enough — we should fail fast on the
    // size check before reading the buffer.
    const r = await validateLogoFile(
      file(LOGO_LIMITS.maxBytes + 1, 'image/png'),
    );
    expect(r).toEqual({ ok: false, error: 'fileTooLarge' });
  });

  it('rejects an unsupported mime (e.g. GIF — fine for photos, off-brand for a logo)', async () => {
    const r = await validateLogoFile(file(4, 'image/gif'));
    expect(r).toEqual({ ok: false, error: 'fileWrongType' });
  });

  it('normalizes "image/jpg" to "image/jpeg"', async () => {
    const r = await validateLogoFile(file(4, 'image/jpg'));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.mime).toBe('image/jpeg');
  });
});

describe('validateFaviconFile', () => {
  it('accepts PNG', async () => {
    const r = await validateFaviconFile(file(4, 'image/png'));
    expect(r.ok).toBe(true);
  });

  it('accepts ICO (image/x-icon)', async () => {
    const r = await validateFaviconFile(file(4, 'image/x-icon'));
    expect(r.ok).toBe(true);
  });

  it('accepts ICO (image/vnd.microsoft.icon) — some browsers tag .ico this way', async () => {
    const r = await validateFaviconFile(
      file(4, 'image/vnd.microsoft.icon'),
    );
    expect(r.ok).toBe(true);
  });

  it('rejects oversized favicons (the cap is tighter than the logo cap)', async () => {
    const r = await validateFaviconFile(
      file(FAVICON_LIMITS.maxBytes + 1, 'image/png'),
    );
    expect(r).toEqual({ ok: false, error: 'fileTooLarge' });
  });

  it('rejects WebP — fine for the logo, not for a favicon (legacy browser support)', async () => {
    const r = await validateFaviconFile(file(4, 'image/webp'));
    expect(r).toEqual({ ok: false, error: 'fileWrongType' });
  });
});

describe('brandingErrorMessage', () => {
  it('quotes the right cap for each kind', () => {
    expect(brandingErrorMessage('logo', 'fileTooLarge')).toContain(
      String(LOGO_LIMITS.maxKb),
    );
    expect(brandingErrorMessage('favicon', 'fileTooLarge')).toContain(
      String(FAVICON_LIMITS.maxKb),
    );
  });

  it('distinguishes accepted formats by kind', () => {
    expect(brandingErrorMessage('logo', 'fileWrongType')).toContain('WebP');
    expect(brandingErrorMessage('favicon', 'fileWrongType')).toContain('ICO');
  });

  it('handles the empty-file case', () => {
    expect(brandingErrorMessage('logo', 'fileEmpty')).toMatch(/no file/i);
  });
});

