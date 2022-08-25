/** @type {import('next').NextConfig} */
const { version } = require("./package.json")

const nextConfig = {
  reactStrictMode: true,
  basePath: "",
  rewrites: async () => {
    return [
      {
        source: "/cgu",
        destination: "/simulateur/src/views/CGU",
      },
      {
        source: "/consulter-index",
        destination: "/",
      },
      {
        source: "/recherche",
        destination: "/recherche",
      },
      {
        source: "/healthz",
        destination: "/api/health",
      },
      {
        source: "/simulateur/home",
        destination: "/simulateur/src/views/Home",
      },
      {
        source: "/mentions-legales",
        destination: "/simulateur/src/views/MentionsLegales",
      },
      {
        source: "/politique-confidentialite",
        destination: "/simulateur/src/views/PolitiqueConfidentialite",
      },
    ]
  },
  publicRuntimeConfig: {
    version,
  },
}

module.exports = nextConfig
