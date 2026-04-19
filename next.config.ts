import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  /* config options here */
};

// Sentry webpack/turbopack plugin wrapper. It inserts source-map upload and
// bundler integrations at build time. With no SENTRY_AUTH_TOKEN / org / project
// set, the build-time steps are skipped and we only get the runtime SDK — which
// is exactly what we want locally and on deploys without a DSN.
export default withSentryConfig(nextConfig, {
  // Keep build output clean unless we're actively debugging the plugin.
  silent: !process.env.CI,
  // Uploading source maps requires these three + SENTRY_AUTH_TOKEN. When they
  // aren't set, the plugin no-ops the upload step.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Route Sentry's ingest through a Next rewrite so ad-blockers don't drop
  // client events. Safe default.
  tunnelRoute: '/monitoring',
});
