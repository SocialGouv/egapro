import { defineConfig } from "cypress";

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  defaultCommandTimeout: 30000,
  experimentalStudio: true,
  video: false,
  screenshotOnRunFailure: false,
  retries: {
    runMode: 2, // Réessayer 2 fois en mode CI
    openMode: 0, // Pas de réessai en mode interactif
  },
  e2e: {
    baseUrl: process.env.TEST_BASEURL ?? "http://localhost:3000",
    env: {
      E2E_USERNAME: process.env.E2E_USERNAME,
      E2E_PASSWORD: process.env.E2E_PASSWORD,
    },
    experimentalRunAllSpecs: true,
    experimentalWebKitSupport: true,
    defaultCommandTimeout: 90000,
    pageLoadTimeout: 90000,
    responseTimeout: 90000,
    requestTimeout: 90000,
    viewportWidth: 1600,
    viewportHeight: 1400,
  },
});
