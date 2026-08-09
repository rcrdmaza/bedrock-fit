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
    // Neither of these ships. `marketing/` is brand assets and a support
    // snippet; `templates/` is an unused landing-page export kept for
    // reference. Between them they produced 4 errors and 10 warnings, which
    // meant `npm run lint` had never exited 0 — so it could not be used as a
    // pre-commit hook or a CI gate, which is the whole point of having it.
    // Nothing here is imported by src/; if either is ever revived, drop the
    // line and fix the findings then.
    "marketing/**",
    "templates/**",
  ]),
]);

export default eslintConfig;
