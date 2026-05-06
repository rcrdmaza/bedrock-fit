// Server-runtime Sentry init. Loaded from `instrumentation.ts` on Node
// workers. Aligned with the canonical `sentry-nextjs-sdk` skill recipe:
// no env-var guard (so a missing DSN produces a loud console warning
// rather than silent no-init), debug: true while we verify ingest,
// includeLocalVariables for richer stack frames, enableLogs for the
// Sentry.logger.* surface used by the wizard's example page.
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  sendDefaultPii: true,
  tracesSampleRate:
    process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  includeLocalVariables: true,
  enableLogs: true,
  // TEMP: prints every event the SDK emits to stdout so Railway runtime
  // logs reveal whether init ran, whether transports succeeded, and
  // exactly where any failure is happening. Drop once verified.
  debug: true,
  environment: process.env.NODE_ENV,
});
