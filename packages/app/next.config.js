/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  rewrites: async () => {
    return [
      {
        source: "/healthz",
        destination: "/api/health",
      },
      // TODO: remove when api v2 is enabled
      {
        source: "/apiv2/:path*",
        destination: "/api/:path*",
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
