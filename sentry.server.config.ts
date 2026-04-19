// Server-runtime Sentry init. Loaded from `instrumentation.ts` on Node
// workers. Guarded on SENTRY_DSN so the app runs fine locally without one —
// `init({ dsn: undefined })` would still swallow events silently, but the
// explicit guard keeps intent obvious and skips the SDK's own bootstrap work.
import * as Sentry from '@sentry/nextjs';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    // Trace every server request in prod. Traffic is low and it gives us
    // useful per-route latency breakdowns. Dial this down if volume grows.
    tracesSampleRate: 1.0,
    // Surface init failures in the Railway logs. In dev we'd rather silence
    // the init banner — it confuses smoke-test output.
    debug: false,
    environment: process.env.NODE_ENV,
  });
}
