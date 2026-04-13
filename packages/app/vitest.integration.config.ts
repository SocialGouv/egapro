import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

/**
 * Integration test config — runs only `*.integration.test.ts` files against
 * a real Postgres container started by `src/test/integration-setup.ts`.
 *
 * Kept in a separate file from `vitest.config.ts` because:
 *  - environment is `node`, not `jsdom`
 *  - we do NOT load `src/test/setup.ts` (which mocks `~/env`, `~/server/db`,
 *    `server-only`, etc.) — the whole point of an integration test is to run
 *    the real modules against a real database.
 *  - test timeouts are larger because container boot + migrations take ~10 s
 *
 * Usage: `pnpm test:integration` (requires a running Docker daemon).
 */
export default defineConfig({
	plugins: [tsconfigPaths()],
	resolve: {
		alias: {
			"~/": new URL("./src/", import.meta.url).pathname,
		},
	},
	test: {
		environment: "node",
		globals: true,
		include: ["src/**/*.integration.test.ts"],
		exclude: ["node_modules", ".next"],
		setupFiles: ["./src/test/integration-per-file-setup.ts"],
		globalSetup: ["./src/test/integration-setup.ts"],
		testTimeout: 30_000,
		hookTimeout: 120_000,
		// Integration tests share a single Postgres container and reset state
		// per test via `beforeEach` — do NOT run files in parallel.
		fileParallelism: false,
	},
});
