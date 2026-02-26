import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const SCSS_MOCK_ID = "\0scss-module-mock";

/**
 * Vite plugin that intercepts SCSS module imports and returns a Proxy-based mock.
 * Uses resolveId + load hooks to bypass the vite:css pipeline entirely,
 * avoiding the sass compiler incompatibility with Vite 7.
 */
const scssModuleMock = {
	name: "scss-module-mock",
	enforce: "pre" as const,
	resolveId(source: string) {
		if (source.endsWith(".module.scss")) {
			return SCSS_MOCK_ID;
		}
	},
	load(id: string) {
		if (id === SCSS_MOCK_ID) {
			return `export default new Proxy({}, { get: (_, name) => typeof name === "string" ? name : "" });`;
		}
	},
};

export default defineConfig({
	plugins: [scssModuleMock, react(), tsconfigPaths()],
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
