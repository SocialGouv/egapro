/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: "/consulter-index",
  rewrites: async () => {
    return [
      {
        source: "/healthz",
        destination: "/api/health",
      },
    ]
  },
}

module.exports = nextConfig
