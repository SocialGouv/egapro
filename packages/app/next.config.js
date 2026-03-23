/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

import { withSentryConfig } from "@sentry/nextjs";

/** @type {import("next").NextConfig} */
const config = {
	output: "standalone",
	outputFileTracingIncludes: {
		"/api/gip-mds/mock": ["./data/mock-gip-mds.csv"],
	},
	serverExternalPackages: ["@react-pdf/renderer"],
	sassOptions: {
		additionalData: `
			@import "@gouvfr/dsfr/src/dsfr/core/style/selector/setting/breakpoint";
			@import "@gouvfr/dsfr/src/dsfr/core/style/selector/tool/breakpoint";
		`,
		silenceDeprecations: ["legacy-js-api", "import", "global-builtin"],
	},
};

export default withSentryConfig(config, {
	// Self-hosted Sentry instance configuration (required for sourcemap uploads)
	org: "incubateur",
	project: "egapro-v2",
	sentryUrl: "https://sentry2.fabrique.social.gouv.fr",
	release: { name: process.env.NEXT_PUBLIC_SENTRY_RELEASE },

	// Upload a larger set of source maps for prettier stack traces (increases build time)
	widenClientFileUpload: true,

	// Tunnel Sentry requests to circumvent ad-blockers
	tunnelRoute: "/monitoring",

	// Source maps: upload to Sentry, then delete from the build output so they're not publicly accessible
	sourcemaps: {
		deleteSourcemapsAfterUpload: true,
	},

	// Use SENTRY_AUTH_TOKEN env var for authentication during source map upload
	authToken: process.env.SENTRY_AUTH_TOKEN,
});
