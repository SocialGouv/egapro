/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import { fileURLToPath } from "node:url";

import "./src/env.js";

import { withSentryConfig } from "@sentry/nextjs";

/** @type {import("next").NextConfig} */
const config = {
	output: "standalone",
	async redirects() {
		return [
			{
				source: "/admin/stats/campagne",
				destination: "/admin/stats#campagne",
				permanent: false,
			},
			{
				source: "/admin/stats/plateforme",
				destination: "/admin/stats#plateforme",
				permanent: false,
			},
		];
	},
	cacheHandler: fileURLToPath(new URL("./cache-handler.cjs", import.meta.url)),
	cacheMaxMemorySize: 0,
	outputFileTracingIncludes: {
		"/api/gip-mds/mock": ["./data/mock-gip-mds.csv"],
	},
	// `notifications` ships pre-compiled JS in dist/ — keep it external so Next
	// never tries to bundle its `pg-boss` / `nodemailer` deps into the app
	// server bundle. The dist tree is produced by `pnpm --filter notifications
	// build` (wired as `predev` and `prebuild` on the app, and run explicitly
	// in the Dockerfile before the Next.js build).
	// `redis` is only required from ./cache-handler.cjs (a standalone CJS
	// handler loaded by Next.js outside the webpack graph).
	serverExternalPackages: ["notifications", "@react-pdf/renderer", "redis"],
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
