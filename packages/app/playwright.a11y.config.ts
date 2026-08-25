import { defineConfig, devices } from "@playwright/test";
import baseConfig from "./playwright.config";
import { AUTH_FILE } from "./src/e2e/helpers/login";

// The RGAA page sweep records a SNAPSHOT of every route (rendered DOM, computed styles,
// boxes, stylesheets, screenshot) into .ultra11y/pages/. Those snapshots are what makes the
// page-scoped criteria decidable at all — `lang`, `title`, computed contrast, focus visible —
// and they re-audit offline afterwards, with no browser.
//
// It lives on its own config so `pnpm test:e2e` never collects it — by extension (`testMatch`
// wants *.e2e.ts) and by the base config's `testIgnore` on **/a11y/**, which is the belt for a
// file someone renames. The sweep walks the whole app and has no business
// slowing the PR gate down. It reuses the base ProConnect login (the `setup` project + shared
// storageState) and dev server, and diverges only on collection, budget and reporting.
export default defineConfig({
	...baseConfig,
	testDir: "./src/e2e/a11y",
	testMatch: "**/*.a11y.ts",
	// The base config ignores **/a11y/** to keep the sweep out of the PR gate; this is the
	// config that OWNS it, so it must clear that ignore to collect anything at all.
	testIgnore: [],
	// A funnel spec walks a full declaration démarche step by step, snapshotting each screen.
	timeout: 120_000,
	// A snapshot is an artefact, not an assertion: re-running a flaky route is cheap, and a
	// missing page silently shrinks the report.
	retries: 1,
	// Nested inside the already-gitignored `playwright-report/` (as the grid config does):
	// a sibling top-level folder would be linted and formatted by biome, which honours
	// .gitignore, and a generated HTML report has no business going through the linter.
	reporter: [
		["list"],
		["html", { open: "never", outputFolder: "playwright-report/a11y" }],
	],
	// Structural, not tuning: the whole suite drives one shared test company (single SIREN,
	// one ProConnect storageState, a callback bound to :3000), so routes must be visited one
	// at a time — a funnel spec mutating the declaration would otherwise race the sweep.
	workers: 1,
	projects: [
		{
			name: "setup",
			testDir: "./src/e2e",
			testMatch: /auth\.setup\.ts/,
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "a11y",
			testMatch: "**/*.a11y.ts",
			use: {
				...devices["Desktop Chrome"],
				storageState: AUTH_FILE,
			},
			dependencies: ["setup"],
		},
	],
});
