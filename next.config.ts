import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
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
