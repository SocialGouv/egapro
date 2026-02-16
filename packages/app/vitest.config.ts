import { defineConfig } from "vitest/config";

export default defineConfig(async () => {
  // `vite-tsconfig-paths` is ESM-only in recent versions.
  // Vitest/Vite may bundle this config as CJS depending on the package type,
  // so we load the plugin via dynamic import to avoid ERR_REQUIRE_ESM.
  const { default: tsconfigPaths } = await import("vite-tsconfig-paths");

  return {
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
  };
});
