import { defineConfig } from 'vitest/config';

// Vitest runs against the same `@/*` alias Next.js uses (from
// tsconfig.json), so tests can import modules the same way the app
// does. We keep the Node environment (no jsdom) — every file currently
// under test is either pure logic or a server action whose UI
// collaborators we mock.
export default defineConfig({
  resolve: {
    // Native tsconfig-paths resolution (Vite 6+). Replaces the former
    // vite-tsconfig-paths plugin, which now warns on install.
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    globals: false,
  },
});
