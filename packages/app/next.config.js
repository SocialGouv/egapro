/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  // next/image is not used: disable the image optimizer (/_next/image answers 404), which removes its attack
  // surface (e.g. GHSA-2xp9-vwfh-vxw4, AVIF RCE through sharp, not fixed on Next 14).
  images: {
    unoptimized: true,
  },
  // TODO optimize deployed output in build mode
  //   output: "standalone",
  experimental: {
    // typedRoutes: true, // TODO activate <3
    // outputFileTracingRoot: path.join(__dirname, "../../"),
    serverComponentsExternalPackages: ["@react-pdf/renderer", "exceljs", "@json2csv/node"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { dev, isServer }) => {
    // Handle font files
    config.module.rules.push({
      test: /\.woff2?$/,
      type: "asset/resource",
    });

    // Configure source maps for production: generated for the Sentry upload, but not referenced from the
    // bundles (hidden), and deleted from the image after the upload (see Dockerfile).
    if (!isServer && !dev) {
      config.devtool = "hidden-source-map";
      config.optimization = {
        ...config.optimization,
        minimize: true,
        moduleIds: "deterministic",
        chunkIds: "deterministic",
      };
    }

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

const { withSentryConfig } = require("@sentry/nextjs/config");

module.exports = withSentryConfig(nextConfig, {
  // Sentry build plugin options
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  sentryUrl: process.env.SENTRY_URL,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Source maps: uploaded to Sentry, hidden from the bundles (see webpack devtool above) and deleted
  // from the build output once uploaded (see also the Dockerfile).
  sourcemaps: {
    assets: ".next/**/*.{js,map}",
    ignore: ["node_modules/**/*"],
    deleteSourcemapsAfterUpload: true,
  },
  widenClientFileUpload: true,

  // Release configuration (the Sentry instance is self-hosted: no build telemetry to sentry.io)
  telemetry: false,
  silent: false,
  release: {
    name: process.env.SENTRY_RELEASE || process.env.NEXT_PUBLIC_GITHUB_SHA || "dev",
    dist: process.env.NEXT_PUBLIC_GITHUB_SHA || "dev",
    setCommits: {
      auto: true,
      ignoreMissing: true,
    },
    deploy: {
      env: process.env.NEXT_PUBLIC_EGAPRO_ENV || "development",
    },
  },

  // Note: tunnelRoute option doesn't work with self-hosted instances, the custom
  // /api/monitoring/envelope tunnel is used instead (see sentry.client.config.ts).
  tunnelRoute: false,

  webpack: {
    autoInstrumentServerFunctions: true,
    autoInstrumentMiddleware: true,
    // Strip the SDK debug logger from the bundles (was `disableLogger` before v11).
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
