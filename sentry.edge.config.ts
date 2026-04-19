// Edge-runtime Sentry init. Loaded from `instrumentation.ts` when
// NEXT_RUNTIME === 'edge'. We don't have edge routes today, but wiring it
// now means middleware or an edge route handler added later gets error
// reporting for free.
import * as Sentry from '@sentry/nextjs';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV,
  });
}
