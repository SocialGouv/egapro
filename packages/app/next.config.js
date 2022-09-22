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
  async redirects() {
    return [
      {
        source: "/",
        destination: "/consulter-index",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
