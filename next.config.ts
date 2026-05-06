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

// Sentry webpack/turbopack plugin wrapper. Inserts source-map upload at
// build time and registers the /monitoring tunnel route at runtime.
// org + project are hardcoded because they identify the destination
// Sentry project (not secrets) and rarely change. authToken is read
// from the env: locally from .env.sentry-build-plugin (gitignored), in
// CI / on Railway from a SENTRY_AUTH_TOKEN env var.
//
// Webpack-specific options that used to live here (treeshake,
// automaticVercelMonitors) were removed because Next 16 builds with
// Turbopack and the Sentry skill explicitly flags webpack.treeshake as
// Turbopack-incompatible. Source-map upload still happens; just via
// the plugin's Turbopack path now.
export default withSentryConfig(nextConfig, {
  org: 'bedrock-uf',
  project: 'javascript-nextjs',

  // Wired explicitly per the canonical skill recipe so missing-token
  // produces a clear plugin warning at build time rather than silently
  // skipping the upload step.
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Only print upload logs in CI — keeps local builds quiet.
  silent: !process.env.CI,

  // Upload a wider source-map set for prettier client stack traces.
  // Slightly slower CI build, but worth it when triaging an obfuscated
  // production error.
  widenClientFileUpload: true,

  // Route browser ingest through a Next rewrite at /monitoring so
  // ad-blockers don't drop client events. Verify any new middleware
  // doesn't shadow this route or client-side reporting will silently
  // break.
  tunnelRoute: '/monitoring',
});
