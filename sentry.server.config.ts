// Server-runtime Sentry init. Loaded from `instrumentation.ts` on Node
// workers. Guarded on SENTRY_DSN so the app runs fine locally without one —
// `init({ dsn: undefined })` would still swallow events silently, but the
// explicit guard keeps intent obvious and skips the SDK's own bootstrap work.
//
// We deliberately keep the DSN out of source so a dev environment without
// SENTRY_DSN doesn't ship its noise to the production Sentry project. Add
// SENTRY_DSN to .env.local (or Railway's project env) to turn this on; see
// .env.example for the variable name.
import * as Sentry from '@sentry/nextjs';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    // Trace every server request in prod. Traffic is low and it gives us
    // useful per-route latency breakdowns. Dial this down if volume grows.
    tracesSampleRate: 1.0,
    // Forwards Sentry.logger.* calls to the Sentry Logs surface. The
    // wizard's example page uses this; cheap to keep on.
    enableLogs: true,
    // Surface init failures in the Railway logs. In dev we'd rather silence
    // the init banner — it confuses smoke-test output.
    debug: false,
    environment: process.env.NODE_ENV,
    // Sends user PII (IP, cookies) along with events. We want this for
    // useful stack traces but it does mean error payloads include client
    // IPs — disable if that ever becomes a concern.
    sendDefaultPii: true,
  });
}
