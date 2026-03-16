import { defineConfig, devices } from "@playwright/test";

import { AUTH_FILE } from "./src/e2e/helpers/login";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const isRemote = !!process.env.SITE_URL;

export default defineConfig({
	globalSetup: "./src/e2e/global-setup.ts",
	testDir: "./src/e2e",
	testMatch: "**/*.e2e.{ts,tsx}",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? "github" : "list",
	timeout: 60_000,
	use: {
		baseURL,
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "setup",
			testMatch: /auth\.setup\.ts/,
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "chromium",
			testMatch: /(?<!logout\.)(?<!compliance\.)e2e\.ts$/,
			use: {
				...devices["Desktop Chrome"],
				storageState: AUTH_FILE,
			},
			dependencies: ["setup"],
		},
		{
			// Compliance tests run AFTER standard tests to avoid DB state pollution
			name: "compliance",
			testMatch: /compliance\.e2e\.ts$/,
			use: {
				...devices["Desktop Chrome"],
				storageState: AUTH_FILE,
			},
			dependencies: ["chromium"],
		},
		{
			name: "logout",
			testMatch: /logout\.e2e\.ts$/,
			use: { ...devices["Desktop Chrome"] },
			dependencies: ["compliance"],
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
