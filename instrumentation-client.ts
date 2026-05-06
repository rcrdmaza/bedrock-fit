// Client-side instrumentation. Next runs this after the HTML is loaded and
// before React hydrates, which is exactly when we want error tracking to
// be live — any hydration crash lands in Sentry instead of the void.
//
// Aligned with the canonical `sentry-nextjs-sdk` skill recipe so the
// behaviour matches Sentry's own troubleshooting tables. Notable
// differences from the previous curated version:
//
//   • No env-var guard around init. The skill's pattern lets the SDK
//     fail loud (DSN missing → console warning) rather than silently
//     skipping, which is what we want while we're still verifying ingest.
//   • debug: true. Verbose SDK logs surface in the browser console;
//     remove once events are confirmed flowing.
//   • sendDefaultPii: true. Includes IP + cookie info on events for
//     better stack-trace context.
//   • tracesSampleRate scaled by environment so dev gets full traces
//     and prod gets a 10% sample.
//   • enableLogs: true. Forwards Sentry.logger.* calls to the Logs UI
//     (the wizard's example page uses this).
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  sendDefaultPii: true,
  tracesSampleRate:
    process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  enableLogs: true,
  // TEMP: surfaces SDK internals in the browser console while we
  // verify ingest works end-to-end. Drop this once Sentry events are
  // confirmed appearing.
  debug: true,
});

// Sentry's helper matches the signature Next expects, so we re-export it
// as-is. Navigations become trace spans, giving us SPA-style breadcrumbs
// around client-side errors.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
