import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react(), tsconfigPaths()],
	resolve: {
		alias: {
			"~/": new URL("./src/", import.meta.url).pathname,
		},
	},
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./src/test/setup.ts"],
		include: ["src/**/*.{test,spec}.{ts,tsx}"],
		exclude: ["src/**/*.e2e.{ts,tsx}", "node_modules", ".next"],
		coverage: {
			provider: "v8",
			reporter: ["text", "lcov", "html"],
			exclude: [
				"node_modules/**",
				".next/**",
				"src/test/**",
				"**/*.config.*",
				"**/*.d.ts",
			],
		},
	},
});
