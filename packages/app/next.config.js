/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  // TODO optimize deployed output in build mode
  //   output: "standalone",
  experimental: {
    // typedRoutes: true, // TODO activate <3
    // outputFileTracingRoot: path.join(__dirname, "../../"),
    serverComponentsExternalPackages: ["@react-pdf/renderer", "xlsx", "xlsx", "js-xlsx", "@json2csv/node"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: config => {
    config.module.rules.push({
      test: /\.woff2?$/,
      type: "asset/resource",
    });
    return config;
  },
  //This option requires Next 13.1 or newer, if you can't update you can use this plugin instead: https://github.com/martpie/next-transpile-modules
  transpilePackages: ["@codegouvfr/react-dsfr"],
  rewrites: async () => {
    return [
      {
        source: "/healthz",
        destination: "/api/health",
      },
      {
        source: "/consulter-index",
        destination: "/index-egapro/recherche",
      },
      // TODO: remove when api v2 is enabled
      {
        source: "/apiv2/:path*",
        destination: "/api/:path*",
      },
      {
        source: "/api/public/referents_egalite_professionnelle.:ext(json|xlsx|csv)",
        destination: "/api/public/referents_egalite_professionnelle/:ext",
      },
      {
        source: "/api/public/referents_egalite_professionnelle",
        destination: "/api/public/referents_egalite_professionnelle/json",
      },
      {
        source: "/api/monitoring/:path*",
        destination: `${process.env.SENTRY_URL}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Content-type",
            value: "application/json; charset=utf-8",
          },
        ],
      },
      {
        source: "/api/monitoring/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "X-Sentry-Auth, Content-Type",
          },
        ],
      },
    ];
  },
  // Uncomment to debug dsfr script in node_modules with reload / nocache
  //   webpack(config, context) {
  //     if (!context.dev) return config;
  //     config.snapshot = {
  //       managedPaths: [/^(.+?[\\/]node_modules[\\/](?!(@gouvfr[\\/]dsfr))(@.+?[\\/])?.+?)[\\/]/],
  //     };

  //     return config;
  //   },
};

module.exports = nextConfig;

// Injected content via Sentry wizard below

const { withSentryConfig } = require("@sentry/nextjs");
const Sentry = require("@sentry/nextjs");

module.exports = withSentryConfig(
  module.exports,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Clean output before source map upload
    cleanArtifacts: true,

    // Enable debug IDs
    injectDebugIds: true,

    // Enable source map uploading
    sourcemaps: {
      assets: "./**/*.{js,map}",
      ignore: ["node_modules/**/*"],
      deleteSourcemapsAfterUpload: true,
    },

    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    url: process.env.SENTRY_URL,
    authToken: process.env.SENTRY_AUTH_TOKEN,

    // Enable debug mode for more verbose output
    debug: true,

    // Suppresses source map uploading logs during build
    // silent: true,
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Transpiles SDK to be compatible with IE11 (increases bundle size)
    transpileClientSDK: true,

    // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers and CORS issues
    // tunnelRoute: "/monitoring",

    // Don't hide source maps from generated client bundles
    hideSourceMaps: false,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enable release injection and component names
    release: {
      inject: true,
      name: process.env.SENTRY_RELEASE || process.env.NEXT_PUBLIC_GITHUB_SHA || "dev",
    },
    includeNames: true,
    autoInstrumentServerFunctions: false,

    // Enables automatic instrumentation of Vercel Cron Monitors.
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  },
);
