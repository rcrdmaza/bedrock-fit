'use client';

// Bottom-fixed consent banner. Renders nothing on first paint (state is
// `null` until we read the cookie post-mount), then either shows itself
// or stays hidden. We accept that brief gap deliberately:
//   - Reading cookies in a server component would opt the layout into
//     dynamic rendering, defeating ISR on every page.
//   - Avoiding SSR for the banner means the rest of the page hydrates
//     without waiting on consent state.
//
// "Cookie preferences" links elsewhere in the chrome dispatch a custom
// DOM event (OPEN_COOKIE_PREFS_EVENT) that we listen for; that's how a
// user re-opens the banner after they've already chosen.
//
// We deliberately don't gate any third-party scripts here. The ad +
// analytics loaders read the cookie themselves and respect the same
// state. This file only handles the UI of recording the choice.

import { useEffect, useState } from 'react';
import {
  acceptAll,
  CONSENT_COOKIE_NAME,
  CONSENT_MAX_AGE_SECONDS,
  parseConsent,
  rejectAll,
  serializeConsent,
  OPEN_COOKIE_PREFS_EVENT,
  type ConsentState,
} from '@/lib/consent';

// Read the cookie out of `document.cookie`. We could pull a cookie
// library, but the format is small enough to inline and keeps the
// client bundle lean.
function readConsentCookie(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const target = `${CONSENT_COOKIE_NAME}=`;
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(target)) return trimmed.slice(target.length);
  }
  return undefined;
}

// Write the cookie. `Secure` is added on https origins so a
// non-HTTPS dev preview (localhost) still works without manual
// overrides. `SameSite=Lax` is the modern default and is fine for our
// use case — we never need this cookie cross-site.
function writeConsentCookie(state: ConsentState) {
  if (typeof document === 'undefined') return;
  const value = serializeConsent(state);
  const isHttps =
    typeof location !== 'undefined' && location.protocol === 'https:';
  const parts = [
    `${CONSENT_COOKIE_NAME}=${value}`,
    `Max-Age=${CONSENT_MAX_AGE_SECONDS}`,
    'Path=/',
    'SameSite=Lax',
  ];
  if (isHttps) parts.push('Secure');
  document.cookie = parts.join('; ');
}

export default function CookieBanner() {
  // `null` = haven't read the cookie yet (initial SSR-equivalent state).
  // `false` = read cookie, user has decided, hide banner.
  // `true` = banner should be visible.
  const [visible, setVisible] = useState<boolean | null>(null);

  // On mount: decide whether to show the banner based on the cookie,
  // and subscribe to the "Cookie preferences" custom event so the
  // footer link can re-open us.
  useEffect(() => {
    const decideFromCookie = () => {
      const parsed = parseConsent(readConsentCookie());
      setVisible(parsed === null);
    };
    decideFromCookie();

    const reopen = () => setVisible(true);
    window.addEventListener(OPEN_COOKIE_PREFS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_PREFS_EVENT, reopen);
  }, []);

  if (!visible) return null;

  const handleAccept = () => {
    writeConsentCookie(acceptAll());
    setVisible(false);
  };
  const handleReject = () => {
    writeConsentCookie(rejectAll());
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie preferences"
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-lg p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 gap-4">
          <div className="text-sm text-stone-700 leading-relaxed">
            We use a few essential cookies to keep the site running, plus
            optional analytics and advertising cookies that help us measure
            usage and fund the service. You can accept all, or keep things
            essential-only. See our{' '}
            <a
              href="/privacy"
              className="text-blue-700 hover:text-blue-900 underline"
            >
              privacy policy
            </a>{' '}
            for details.
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:shrink-0">
            <button
              type="button"
              onClick={handleReject}
              className="text-sm text-stone-700 border border-slate-200 hover:border-slate-400 px-4 py-2 rounded-lg transition-colors"
            >
              Essential only
            </button>
            <button
              type="button"
              onClick={handleAccept}
              className="text-sm bg-stone-900 text-white hover:bg-stone-700 px-4 py-2 rounded-lg transition-colors font-medium"
            >
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
