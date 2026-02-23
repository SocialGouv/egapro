/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

import { withSentryConfig } from "@sentry/nextjs";

/** @type {import("next").NextConfig} */
const config = {
	output: "standalone",
};

export default withSentryConfig(config, {
	// Upload a larger set of source maps for prettier stack traces (increases build time)
	widenClientFileUpload: true,

	// Tree-shake Sentry logger statements to reduce bundle size
	disableLogger: true,

	// Tunnel Sentry requests to circumvent ad-blockers
	tunnelRoute: "/monitoring",

	// Source maps: upload to Sentry, then delete from the build output so they're not publicly accessible
	sourcemaps: {
		deleteSourcemapsAfterUpload: true,
	},

	// Use SENTRY_AUTH_TOKEN env var for authentication during source map upload
	authToken: process.env.SENTRY_AUTH_TOKEN,
});
