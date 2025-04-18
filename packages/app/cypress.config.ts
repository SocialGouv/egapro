import { defineConfig } from "cypress";

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  defaultCommandTimeout: 30000,
  experimentalStudio: true,
  video: false,
  screenshotOnRunFailure: false,
  e2e: {
    baseUrl: process.env.TEST_BASEURL ?? "http://localhost:3000",
    env: {
      E2E_USERNAME: process.env.E2E_USERNAME,
      E2E_PASSWORD: process.env.E2E_PASSWORD,
    },
    setupNodeEvents(_on, _config) {
      // implement node event listeners here
    },
    experimentalRunAllSpecs: true,
    experimentalWebKitSupport: true,
    defaultCommandTimeout: 60000,
    pageLoadTimeout: 60000,
    responseTimeout: 60000,
    requestTimeout: 60000,
    viewportWidth: 1600,
    viewportHeight: 1400,
  },
});
