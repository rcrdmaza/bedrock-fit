import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Cold storage for the org/multi-tenant slice; it imports paths
    // and types we no longer keep in src/, so linting it would just
    // produce noise. See archiv3ed/README.md for revival steps.
    "archiv3ed/**",
  ]),
]);

export default eslintConfig;
