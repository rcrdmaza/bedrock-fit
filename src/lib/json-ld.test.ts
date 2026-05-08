import { describe, expect, it } from 'vitest';
import {
  eventCanonicalPath,
  personLd,
  serializeJsonLd,
  sportsEventLd,
} from './json-ld';

const BASE = 'https://bedrock.fit';

describe('eventCanonicalPath', () => {
  it('encodes the triple as URL params', () => {
    const path = eventCanonicalPath({
      eventName: 'Lima Marathon',
      eventDate: '2024-04-12T00:00:00Z',
      raceCategory: '10K',
    });
    expect(path).toBe(
      '/events?name=Lima+Marathon&date=2024-04-12T00%3A00%3A00Z&category=10K',
    );
  });
});

describe('sportsEventLd', () => {
  const base = {
    eventName: 'Lima Marathon',
    eventDate: '2024-04-12T00:00:00Z',
    raceCategory: '10K',
    city: 'Lima',
    district: null,
    country: 'Peru',
    summary: 'A scenic coastal 10K through Miraflores.',
  };

  it('emits the required SportsEvent fields', () => {
    const ld = sportsEventLd(base, BASE);
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('SportsEvent');
    expect(ld.name).toBe('Lima Marathon — 10K');
    expect(ld.startDate).toBe('2024-04-12T00:00:00Z');
    expect(ld.sport).toBe('Running');
    expect(ld.url).toBe(
      'https://bedrock.fit/events?name=Lima+Marathon&date=2024-04-12T00%3A00%3A00Z&category=10K',
    );
  });

  it('builds a Place with PostalAddress when city/country are set', () => {
    const ld = sportsEventLd(base, BASE);
    const location = ld.location as Record<string, unknown>;
    expect(location['@type']).toBe('Place');
    expect(location.name).toBe('Lima · Peru');
    const address = location.address as Record<string, unknown>;
    expect(address['@type']).toBe('PostalAddress');
    expect(address.addressLocality).toBe('Lima');
    expect(address.addressCountry).toBe('Peru');
    expect(address.addressRegion).toBeUndefined();
  });

  it('omits address entirely when no location pieces are set', () => {
    const ld = sportsEventLd(
      { ...base, city: null, district: null, country: null },
      BASE,
    );
    const location = ld.location as Record<string, unknown>;
    expect(location.address).toBeUndefined();
    // Falls back to the event name when there's no human-readable
    // place to render.
    expect(location.name).toBe('Lima Marathon');
  });

  it('omits description when summary is null or whitespace', () => {
    const a = sportsEventLd({ ...base, summary: null }, BASE);
    const b = sportsEventLd({ ...base, summary: '   ' }, BASE);
    expect(a.description).toBeUndefined();
    expect(b.description).toBeUndefined();
  });

  it('emits an http image URL when provided', () => {
    const ld = sportsEventLd(
      { ...base, imageUrl: 'https://cdn.example.com/event.jpg' },
      BASE,
    );
    expect(ld.image).toBe('https://cdn.example.com/event.jpg');
  });

  it('skips data: URL images (search engines cannot fetch them)', () => {
    const ld = sportsEventLd(
      { ...base, imageUrl: 'data:image/png;base64,iVBORw0KGgo...' },
      BASE,
    );
    expect(ld.image).toBeUndefined();
  });

  it('marks the event as scheduled offline by default', () => {
    const ld = sportsEventLd(base, BASE);
    expect(ld.eventStatus).toBe('https://schema.org/EventScheduled');
    expect(ld.eventAttendanceMode).toBe(
      'https://schema.org/OfflineEventAttendanceMode',
    );
  });
});

describe('personLd', () => {
  it('emits the required Person fields', () => {
    const ld = personLd(
      { id: 'a-uuid', displayName: 'Carlos Mendez' },
      BASE,
    );
    expect(ld['@type']).toBe('Person');
    expect(ld.name).toBe('Carlos Mendez');
    expect(ld.url).toBe('https://bedrock.fit/athletes/a-uuid');
  });

  it('emits avatar as @image when it is an http URL', () => {
    const ld = personLd(
      {
        id: 'a',
        displayName: 'Maria',
        avatarUrl: 'https://cdn.example.com/maria.jpg',
      },
      BASE,
    );
    expect(ld.image).toBe('https://cdn.example.com/maria.jpg');
  });

  it('skips data: URL avatars', () => {
    const ld = personLd(
      {
        id: 'a',
        displayName: 'Maria',
        avatarUrl: 'data:image/png;base64,...',
      },
      BASE,
    );
    expect(ld.image).toBeUndefined();
  });

  it('handles a base URL with a trailing slash', () => {
    const ld = personLd(
      { id: 'a-uuid', displayName: 'Carlos' },
      'https://bedrock.fit/',
    );
    expect(ld.url).toBe('https://bedrock.fit/athletes/a-uuid');
  });
});

describe('serializeJsonLd', () => {
  it('escapes </ to prevent script-tag breakouts', () => {
    const out = serializeJsonLd({
      '@context': 'https://schema.org',
      description: 'A nasty </script> in the description',
    });
    expect(out).not.toContain('</script>');
    expect(out).toContain('<\\/script>');
  });

  it('round-trips through JSON.parse with the escape unwound', () => {
    const ld = { '@type': 'Person', name: 'A </b>old user</b>' };
    const out = serializeJsonLd(ld);
    // Browsers unescape backslashes inside JSON strings, so the
    // canonical text round-trips. We unescape manually here to
    // simulate what the browser does.
    const browserRead = JSON.parse(out.replace(/<\\\//g, '</'));
    expect(browserRead).toEqual(ld);
  });
});
