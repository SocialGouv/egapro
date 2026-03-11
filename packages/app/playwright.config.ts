import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const isRemote = !!process.env.SITE_URL;
const AUTH_FILE = path.join(import.meta.dirname, "src/e2e/.auth/user.json");

export default defineConfig({
	globalSetup: "./src/e2e/global-setup.ts",
	testDir: "./src/e2e",
	testMatch: "**/*.e2e.{ts,tsx}",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? "github" : "list",
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
			testMatch: /(?<!logout\.)e2e\.ts$/,
			use: {
				...devices["Desktop Chrome"],
				storageState: AUTH_FILE,
			},
			dependencies: ["setup"],
		},
		{
			name: "logout",
			testMatch: /logout\.e2e\.ts$/,
			use: { ...devices["Desktop Chrome"] },
			dependencies: ["chromium"],
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
