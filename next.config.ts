import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  // Version-skew protection. Railway injects RAILWAY_DEPLOYMENT_ID
  // (unique UUID per deploy) at build and run time; passing it here
  // makes Next stamp assets with ?dpl=<id> and check it on every
  // navigation. When a browser tab outlives a deploy, the mismatch
  // triggers a full-page reload instead of a "Failed to find Server
  // Action" on the next form submit. RAILWAY_GIT_COMMIT_SHA is
  // preferred when present (stable across re-runs of the same
  // commit), otherwise the UUID keeps us protected. Undefined locally
  // so Next generates its own per-build id in dev.
  deploymentId:
    process.env.RAILWAY_GIT_COMMIT_SHA ?? process.env.RAILWAY_DEPLOYMENT_ID,
  experimental: {
    serverActions: {
      // CSV imports go through a server action as FormData. Next's 1 MB
      // default rejects our real-race CSVs (Boston 2015 is ~2 MB of 26k
      // rows) before previewImport() sees them. The action itself caps
      // the raw CSV at 5 MB (MAX_CSV_BYTES in src/app/actions/import.ts);
      // 6 MB here leaves headroom for FormData encoding overhead without
      // outgrowing that cap.
      bodySizeLimit: '6mb',
    },
  },
};

// Sentry webpack/turbopack plugin wrapper. Inserts source-map upload and
// bundler integrations at build time. With no SENTRY_AUTH_TOKEN set, the
// build-time upload step is skipped and we only get the runtime SDK —
// exactly what we want locally and on deploys without ingest credentials.
//
// org + project are hardcoded because they identify the destination Sentry
// project (not secrets) and rarely change. SENTRY_AUTH_TOKEN must come
// from .env.sentry-build-plugin (gitignored) or the build environment for
// source-map upload to actually run.
export default withSentryConfig(nextConfig, {
  org: 'bedrock-uf',
  project: 'javascript-nextjs',

  // Only print upload logs in CI — keeps local builds quiet.
  silent: !process.env.CI,

  // Upload a wider source-map set for prettier client stack traces. Slower
  // CI build, but worth it when triaging an obfuscated production error.
  widenClientFileUpload: true,

  // Route browser ingest through a Next rewrite at /monitoring so
  // ad-blockers don't drop client events. Verify any new middleware
  // doesn't shadow this route or client-side reporting will silently
  // break.
  tunnelRoute: '/monitoring',

  webpack: {
    // Vercel Cron Monitors auto-instrumentation — harmless on Railway
    // (we don't run Vercel cron jobs). The plugin no-ops if the env
    // doesn't expose the relevant signals.
    automaticVercelMonitors: true,
    treeshake: {
      // Drop Sentry.logger.* debug calls from the production bundle.
      // We still emit info+ from the example page; this only strips
      // debug-level statements behind the SDK's compile-time flag.
      removeDebugLogging: true,
    },
  },
});
