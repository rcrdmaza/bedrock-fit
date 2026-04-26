import { describe, expect, it } from 'vitest';
import { validateAvatarFile, AVATAR_LIMITS, type BlobLike } from './avatar';

// Construct a minimal BlobLike from a byte array + mime. Avoids
// depending on the Node File polyfill so the tests run anywhere vitest
// runs.
function fakeBlob(bytes: number, mime: string, content?: Uint8Array): BlobLike {
  // Default content fills with a recognizable byte pattern so the
  // base64 in the data URL is deterministic for snapshot-style checks.
  const buf = content ?? new Uint8Array(bytes).fill(0xab);
  return {
    size: buf.byteLength,
    type: mime,
    async arrayBuffer() {
      // Copy into a fresh ArrayBuffer so the helper can't mutate the
      // original (matches Web File semantics) and TS narrows away
      // SharedArrayBuffer from `Uint8Array.buffer`.
      const out = new ArrayBuffer(buf.byteLength);
      new Uint8Array(out).set(buf);
      return out;
    },
  };
}

describe('validateAvatarFile', () => {
  it('rejects empty uploads with a clear message', async () => {
    const result = await validateAvatarFile(fakeBlob(0, 'image/png'));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/no image/i);
  });

  it('rejects files over the size cap', async () => {
    const oneKiBOver = AVATAR_LIMITS.maxBytes + 1024;
    const result = await validateAvatarFile(
      fakeBlob(oneKiBOver, 'image/png', new Uint8Array(oneKiBOver)),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/too large/i);
  });

  it('rejects non-image MIME types', async () => {
    const result = await validateAvatarFile(
      fakeBlob(10, 'application/pdf', new Uint8Array(10)),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/png|jpeg|webp|gif/i);
  });

  it('rejects SVG even though it is technically an image', async () => {
    // We deliberately keep SVG out of the allowlist — see the comment
    // in avatar.ts. This test pins that behavior so a future "let's
    // accept SVG too" isn't a one-line accidental change.
    const result = await validateAvatarFile(
      fakeBlob(10, 'image/svg+xml', new Uint8Array(10)),
    );
    expect(result.ok).toBe(false);
  });

  it('accepts a small PNG and returns a data URL', async () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
    const result = await validateAvatarFile(fakeBlob(6, 'image/png', bytes));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.mime).toBe('image/png');
      expect(result.bytes).toBe(6);
      expect(result.dataUrl.startsWith('data:image/png;base64,')).toBe(true);
      // The PNG signature in base64 — sanity-check the round-trip
      // didn't drop bytes.
      expect(result.dataUrl).toContain('iVBORw0K');
    }
  });

  it('accepts JPEG and WebP', async () => {
    const jpg = await validateAvatarFile(
      fakeBlob(8, 'image/jpeg', new Uint8Array(8)),
    );
    expect(jpg.ok).toBe(true);
    const webp = await validateAvatarFile(
      fakeBlob(8, 'image/webp', new Uint8Array(8)),
    );
    expect(webp.ok).toBe(true);
  });

  it('remaps the common "image/jpg" typo to image/jpeg', async () => {
    // Some browsers (and a lot of hand-rolled clients) send the wrong
    // MIME for JPEGs. Treat it as the intended type rather than
    // bouncing the upload.
    const result = await validateAvatarFile(
      fakeBlob(8, 'image/jpg', new Uint8Array(8)),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.mime).toBe('image/jpeg');
      expect(result.dataUrl.startsWith('data:image/jpeg;base64,')).toBe(true);
    }
  });
});
