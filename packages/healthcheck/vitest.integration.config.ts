import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		globals: true,
		include: ["src/**/*.integration.test.ts"],
		exclude: ["node_modules", "dist"],
		globalSetup: ["./src/test/integration-setup.ts"],
		testTimeout: 30_000,
		hookTimeout: 120_000,
		fileParallelism: false,
	},
});
