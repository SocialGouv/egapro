import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

// NOTE:
// - We keep this file as ESM by using the `.mts` extension.
// - This avoids `ERR_REQUIRE_ESM` with `vite-tsconfig-paths` *and* prevents
//   Next's TypeScript step from type-checking this config (since the Next
//   tsconfig typically only includes `**/*.ts(x)` patterns).
export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: [
      // Handle the special design-system import pattern
      {
        find: /(?:\.\.\/)*design-system\/@design-system/,
        replacement: "./src/design-system/server.ts",
      },
    ],
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/__tests__/**/*.{test,spec}.{ts,tsx}", "**/*.{test,spec}.{ts,tsx}"],
    exclude: [".next/**", "node_modules/**", "cypress/**"],
    testTimeout: 20000,
    css: false,
    // Use forks pool with memory limit per fork
    pool: "forks",
    poolOptions: {
      forks: {
        execArgv: ["--max-old-space-size=4096"],
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.{js,jsx,ts,tsx}"],
      exclude: [
        "*.{js,ts}",
        "vitest.setup.ts",
        "**/node_modules/**",
        "**/vendor/**",
        "**/__tests__/**",
        "**/cypress/**",
      ],
      reportsDirectory: "coverage",
    },
  },
});
