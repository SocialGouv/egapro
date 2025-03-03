import { defineConfig } from "cypress";

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  defaultCommandTimeout: 30000,
  experimentalStudio: true,
  video: false,
  screenshotOnRunFailure: false,
  e2e: {
    baseUrl: process.env.TEST_BASEURL ?? "http://localhost:3000",
    setupNodeEvents(_on, _config) {
      // implement node event listeners here
    },
    experimentalRunAllSpecs: true,
    experimentalWebKitSupport: true,
    defaultCommandTimeout: 100000,
    pageLoadTimeout: 100000,
    responseTimeout: 100000,
    requestTimeout: 100000,
    viewportWidth: 1600,
    viewportHeight: 1400,
  },
});
