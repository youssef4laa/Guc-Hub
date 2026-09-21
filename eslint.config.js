// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const boundaries = require("eslint-plugin-boundaries");
const prettierConfig = require("eslint-config-prettier");

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    plugins: { boundaries },
    settings: {
      "boundaries/include": ["src/**/*", "app/**/*"],
      "boundaries/elements": [
        { type: "core", pattern: "src/core/*" },
        { type: "feature", pattern: "src/features/*", capture: ["featureId"] },
        { type: "app", pattern: "app/**/*" },
      ],
    },
    rules: {
      // Features are self-contained: a feature may use core/, and may reach into
      // its own folder, but never another feature's internals. This is what makes
      // two tracks safe to build in parallel (see docs/CONTRIBUTING.md).
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies: [
            { from: { element: { type: "core" } }, allow: [{ to: { element: { type: "core" } } }] },
            {
              from: { element: { type: "feature" } },
              allow: [
                { to: { element: { type: "core" } } },
                { to: { element: { type: "feature", captured: { featureId: "{{from.featureId}}" } } } },
              ],
            },
            {
              from: { element: { type: "app" } },
              allow: [{ to: { element: { type: "core" } } }, { to: { element: { type: "feature" } } }],
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/core/http/client.ts"],
    rules: {
      "no-restricted-globals": [
        "error",
        {
          name: "fetch",
          message: "Use gucFetch from src/core/http instead of raw fetch — it enforces the host allowlist.",
        },
      ],
    },
  },
  {
    files: ["tools/**/*.js"],
    languageOptions: {
      globals: {
        __dirname: "readonly",
        __filename: "readonly",
        require: "readonly",
        module: "writable",
        process: "readonly",
        console: "readonly",
      },
    },
  },
  {
    files: ["tools/**/*.test.js", "**/__tests__/**/*.{js,ts,tsx}", "**/*.test.{js,ts,tsx}"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        jest: "readonly",
      },
    },
  },
  {
    ignores: ["dist/*", "src/core/registry/registry.generated.ts", "fixtures/**/raw.local/**", ".expo/**"],
  },
]);
