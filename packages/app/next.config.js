/** @type {import('next').NextConfig} */
const { version } = require("./package.json")

const nextConfig = {
  reactStrictMode: true,
  basePath: "",
  rewrites: async () => {
    return [
      {
        source: "/consulter-index",
        destination: "/",
      },
      {
        source: "/consulter-index/recherche",
        destination: "/recherche",
      },
      {
        source: "/healthz",
        destination: "/api/health",
      },
      {
        source: "/simulateur/home",
        destination: "/simulateur/Home",
      },
      {
        source: "/simulateur/cgu",
        destination: "/simulateur/CGU",
      },
      {
        source: "/simulateur/mentions-legales",
        destination: "/simulateur/MentionsLegales",
      },
      {
        source: "/simulateur/politique-confidentialite",
        destination: "/simulateur/PolitiqueConfidentialite",
      },
    ]
  },
  publicRuntimeConfig: {
    version,
  },
}

module.exports = nextConfig
