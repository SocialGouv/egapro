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
  webpack: (config, { dev, isServer }) => {
    // Handle font files
    config.module.rules.push({
      test: /\.woff2?$/,
      type: "asset/resource",
    });

    // Configure source maps for production
    if (!isServer && !dev) {
      config.devtool = "source-map";
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

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(
  nextConfig,
  {
    // Sentry webpack plugin options
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    url: process.env.SENTRY_URL,
    authToken: process.env.SENTRY_AUTH_TOKEN,

    // Source maps configuration
    sourcemaps: {
      assets: ".next/**/*.{js,map}",
      ignore: ["node_modules/**/*"],
      rewrite: true,
      stripPrefix: ["webpack://_N_E/", "webpack://", "app://"],
      urlPrefix: "app:///_next",
    },

    // Debug and release configuration
    silent: false,
    debug: true,
    release: process.env.SENTRY_RELEASE || process.env.NEXT_PUBLIC_GITHUB_SHA || "dev",
    dist: process.env.NEXT_PUBLIC_GITHUB_SHA || "dev",
    setCommits: {
      auto: true,
      ignoreMissing: true,
    },
    deploy: {
      env: process.env.NEXT_PUBLIC_EGAPRO_ENV || "development",
      dist: process.env.NEXT_PUBLIC_GITHUB_SHA || "dev",
    },
    injectBuildInformation: true,
  },
  {
    // Sentry Next.js SDK options
    // Note: tunnelRoute option doesn't work with self-hosted instances
    // Using custom tunnel implementation instead
    tunnelRoute: false,
    widenClientFileUpload: true,
    hideSourceMaps: false,
    disableLogger: true,

    // Enable component names and release injection
    includeNames: true,
    release: {
      inject: true,
      name: process.env.SENTRY_RELEASE || process.env.NEXT_PUBLIC_GITHUB_SHA || "dev",
    },

    // Server instrumentation options
    autoInstrumentServerFunctions: true,
    autoInstrumentMiddleware: true,
    automaticVercelMonitors: true,
  },
);
