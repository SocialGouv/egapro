/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  rewrites: async () => {
    return [
      {
        source: "/healthz",
        destination: "/api/health",
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
