// Root instrumentation hook. Next calls `register()` exactly once per
// server instance before accepting traffic, and routes uncaught request
// errors through `onRequestError`.
//
// We delegate the runtime-specific Sentry init into separate files
// (sentry.server.config, sentry.edge.config) so each can import only what
// it needs — the edge bundle is size-sensitive, and mixing Node-only APIs
// into the edge config would break the edge build.
import * as Sentry from '@sentry/nextjs';

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Forwards server render / route handler / server action errors to Sentry.
// Safe to export unconditionally — if no DSN is configured, the Sentry
// client is a no-op and this just returns undefined.
export const onRequestError = Sentry.captureRequestError;
