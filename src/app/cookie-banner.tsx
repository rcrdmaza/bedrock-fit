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
// Beyond the UI, this component is the bridge to Google Consent Mode
// v2: every accept/reject (and the mount-time read for a returning
// visitor) pushes a `consent: update` so the AdSense loader knows
// whether it may set ad cookies / personalize. The denied default is
// set earlier by ConsentInit (beforeInteractive); this file only
// ever *upgrades or confirms* that state.

import { useEffect, useState } from 'react';
import {
  acceptAll,
  consentModeSignal,
  CONSENT_COOKIE_NAME,
  CONSENT_MAX_AGE_SECONDS,
  parseConsent,
  rejectAll,
  serializeConsent,
  OPEN_COOKIE_PREFS_EVENT,
  type ConsentState,
} from '@/lib/consent';

// gtag is defined globally by ConsentInit's beforeInteractive script.
// Typed loosely here because the consent-mode call surface is the
// only thing we touch and Google's own types aren't installed.
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// Push a Consent Mode v2 `update` reflecting the chosen state. Safe to
// call before gtag exists (optional-chains to a no-op) — though in
// practice ConsentInit runs beforeInteractive, well before this
// client component hydrates.
function pushConsentUpdate(state: ConsentState): void {
  if (typeof window === 'undefined') return;
  window.gtag?.('consent', 'update', consentModeSignal(state));
}

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
      // Returning visitor with a stored choice: replay it into
      // Consent Mode so the AdSense loader honours their earlier
      // decision instead of sitting on the denied default. The
      // `wait_for_update` window in ConsentInit gives this push
      // time to land before tags fall back.
      if (parsed) pushConsentUpdate(parsed);
      setVisible(parsed === null);
    };
    decideFromCookie();

    const reopen = () => setVisible(true);
    window.addEventListener(OPEN_COOKIE_PREFS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_PREFS_EVENT, reopen);
  }, []);

  if (!visible) return null;

  const handleAccept = () => {
    const state = acceptAll();
    writeConsentCookie(state);
    pushConsentUpdate(state);
    setVisible(false);
  };
  const handleReject = () => {
    const state = rejectAll();
    writeConsentCookie(state);
    pushConsentUpdate(state);
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
