import { defineConfig, devices } from "@playwright/test";

import { AUTH_FILE } from "./src/e2e/helpers/login";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const isRemote = !!process.env.SITE_URL;

export default defineConfig({
	globalSetup: "./src/e2e/global-setup.ts",
	testDir: "./src/e2e",
	testMatch: "**/*.e2e.{ts,tsx}",
	// The 185-coordinate grid (#4022) and the RGAA page sweep both have their own config and
	// reporter; keep them out of THIS collection even if one of their files were ever renamed
	// to *.e2e.ts by mistake. `testMatch` above already misses them by extension — this is the
	// belt, and it is the one the sweep's config says exists. The grid is a PR gate all the
	// same, run from its own config as its own shards in .github/workflows/e2e.yaml; what this
	// line prevents is the two collections overlapping and running the same coordinate twice.
	testIgnore: ["**/grille/**", "**/a11y/**"],
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	// All tests share the same database record (SIREN 130025265), so parallel
	// execution causes race conditions between declaration and compliance tests.
	workers: 1,
	reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
	timeout: 60_000,
	use: {
		baseURL,
		trace: "retain-on-failure",
	},
	projects: [
		{
			name: "setup",
			testMatch: /auth\.setup\.ts/,
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "chromium",
			testMatch: /(?<!logout\.)e2e\.ts$/,
			use: {
				...devices["Desktop Chrome"],
				storageState: AUTH_FILE,
			},
			dependencies: ["setup"],
		},
		// Depends on `setup`, NOT on `chromium`: Playwright only shards top-level
		// projects and replays a dependency project whole inside every shard that
		// needs it, so making `chromium` a dependency would collapse the whole
		// suite into one shard. Sharing `setup` as the sole dependency keeps both
		// projects top-level — hence shardable. The ordering `logout` needs (after
		// `chromium`, which the lock release in api/auth/logout expects) is no longer
		// structural: both projects now sit in the SAME dependency phase, and what
		// still serialises them is `workers: 1` above draining the declaration-ordered
		// queue one group at a time. Raising `workers` would let them interleave.
		{
			name: "logout",
			testMatch: /logout\.e2e\.ts$/,
			use: { ...devices["Desktop Chrome"] },
			dependencies: ["setup"],
		},
	],
	...(isRemote
		? {}
		: {
				webServer: {
					command: "pnpm start",
					url: baseURL,
					reuseExistingServer: !process.env.CI,
					timeout: 120_000,
				},
			}),
});
