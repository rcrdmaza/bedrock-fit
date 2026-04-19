// Client-side instrumentation. Next runs this after the HTML is loaded and
// before React hydrates, which is exactly when we want error tracking to
// be live — any hydration crash lands in Sentry instead of the void.
//
// NEXT_PUBLIC_SENTRY_DSN is read at build time and inlined into the bundle.
// If it's unset we skip init entirely so we don't ship a dead SDK path in
// dev builds.
import * as Sentry from '@sentry/nextjs';

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1.0,
    // No session replay / no user feedback widget — keep the client bundle
    // small. Add these later if we actually need them.
    environment: process.env.NODE_ENV,
  });
}

// Sentry's helper matches the signature Next expects, so we re-export it
// as-is. Navigations become trace spans, giving us SPA-style breadcrumbs
// around client-side errors.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
