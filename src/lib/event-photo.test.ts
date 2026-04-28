import { describe, expect, it } from 'vitest';
import {
  EVENT_PHOTO_LIMITS,
  validateEventPhotoFile,
  type BlobLike,
} from './event-photo';

// Synthetic blob factory. We don't need the bytes to look like a real
// PNG — the validator only inspects size + MIME, then base64-encodes —
// so any payload of the requested length is fine.
function blob(size: number, type: string): BlobLike {
  return {
    size,
    type,
    async arrayBuffer() {
      return new Uint8Array(size).buffer;
    },
  };
}

describe('event-photo', () => {
  it('accepts a valid PNG', async () => {
    const r = await validateEventPhotoFile(blob(1024, 'image/png'));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.dataUrl.startsWith('data:image/png;base64,')).toBe(true);
      expect(r.bytes).toBe(1024);
      expect(r.mime).toBe('image/png');
    }
  });

  it('normalizes image/jpg to image/jpeg', async () => {
    const r = await validateEventPhotoFile(blob(2048, 'image/jpg'));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.mime).toBe('image/jpeg');
  });

  it('rejects an empty file with a stable error code', async () => {
    const r = await validateEventPhotoFile(blob(0, 'image/png'));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('fileEmpty');
  });

  it('rejects oversize files', async () => {
    const r = await validateEventPhotoFile(
      blob(EVENT_PHOTO_LIMITS.maxBytes + 1, 'image/png'),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('fileTooLarge');
  });

  it('rejects disallowed MIME types', async () => {
    const r = await validateEventPhotoFile(blob(1024, 'image/svg+xml'));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('fileWrongType');
  });

  it('accepts the four allowed image MIMEs', async () => {
    for (const mime of ['image/png', 'image/jpeg', 'image/webp', 'image/gif']) {
      const r = await validateEventPhotoFile(blob(512, mime));
      expect(r.ok).toBe(true);
    }
  });
});
