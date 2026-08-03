import { defineConfig, devices } from "@playwright/test";
import baseConfig from "./playwright.config";
import { AUTH_FILE } from "./src/e2e/helpers/login";

// The 185-coordinate grid (#4022) is a nightly asset, not a PR gate: it lives on
// its own config so `pnpm test:e2e` never collects it (belt: the base config
// also carries a `testIgnore` on **/grille/**). It reuses the base ProConnect
// login (the `setup` project + shared storageState) and dev server, and diverges
// only on collection, budget and reporting.
export default defineConfig({
	...baseConfig,
	testDir: "./src/e2e/grille",
	testMatch: "**/*.grille.ts",
	// The base config ignores **/grille/** to keep the grid out of the PR gate;
	// this is the config that owns the grid, so it must collect it.
	testIgnore: [],
	// One coordinate drives a full declaration démarche (up to a corrective second
	// declaration + CSE opinion), so it needs more room than a single-screen e2e.
	timeout: 120_000,
	// A lone flake must not condemn a multi-hour nightly run; two consecutive
	// failures on the same coordinate still do.
	retries: 1,
	reporter: [
		["list"],
		["json", { outputFile: "playwright-report/grille-results.json" }],
		// The HTML reporter wipes its outputFolder on start; keep it in a subfolder
		// so it never clobbers the JSON report #4071 consumes at the path above.
		["html", { open: "never", outputFolder: "playwright-report/html" }],
	],
	// Structural, not tuning: the grid drives one shared test company (single SIREN,
	// one ProConnect storageState, a callback bound to :3000), so coordinates must
	// run one at a time.
	workers: 1,
	projects: [
		{
			name: "setup",
			testDir: "./src/e2e",
			testMatch: /auth\.setup\.ts/,
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "grille",
			testMatch: "**/*.grille.ts",
			use: {
				...devices["Desktop Chrome"],
				storageState: AUTH_FILE,
			},
			dependencies: ["setup"],
		},
	],
});
