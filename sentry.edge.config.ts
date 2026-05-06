// Edge-runtime Sentry init. Loaded from `instrumentation.ts` when
// NEXT_RUNTIME === 'edge'. Mirrors the server config sans
// `includeLocalVariables` (not supported on the edge runtime).
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  sendDefaultPii: true,
  tracesSampleRate:
    process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  enableLogs: true,
  debug: true,
  environment: process.env.NODE_ENV,
});
