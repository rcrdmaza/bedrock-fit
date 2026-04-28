'use client';

// Tiny client component the footer renders to re-open the cookie banner
// after the user has already chosen. Lives apart from CookieBanner so
// the footer (a server component) doesn't need to become client just to
// dispatch a single event.
//
// We render an `<a href="/privacy">` underneath the click handler so
// users without JS still land on the privacy page, where the same
// preferences are explained — graceful degradation rather than a dead
// button.

import { OPEN_COOKIE_PREFS_EVENT } from '@/lib/consent';

export default function CookiePrefsLink({
  className,
}: {
  className?: string;
}) {
  return (
    <a
      href="/privacy"
      onClick={(e) => {
        // Only intercept if the banner is on the page (i.e. CookieBanner
        // is mounted and listening). If the listener doesn't fire we
        // fall through to the href, so the user still ends up
        // somewhere useful.
        e.preventDefault();
        window.dispatchEvent(new Event(OPEN_COOKIE_PREFS_EVENT));
      }}
      className={className}
    >
      Cookie preferences
    </a>
  );
}
