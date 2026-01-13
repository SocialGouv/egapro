/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  turbopack: {},
  // TODO optimize deployed output in build mode
  //   output: "standalone",
  experimental: {
    // typedRoutes: true, // TODO activate <3
    // outputFileTracingRoot: path.join(__dirname, "../../"),
  },
  webpack: (config, { dev, isServer }) => {
    // Handle font files
    config.module.rules.push({
      test: /\\.woff2?$/,
      type: "asset/resource",
    });

    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push(({ context, request }, callback) => {
        // Keep heavy server-only packages external to avoid bundling them into the server build.
        const packages = ["@react-pdf/renderer", "xlsx", "js-xlsx", "@json2csv/node", "pino", "postgres"];
        if (packages.some(pkg => request === pkg || request.startsWith(pkg + "/"))) {
          return callback(null, `commonjs ${request}`);
        }
        callback();
      });
    }

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
};

module.exports = nextConfig;
