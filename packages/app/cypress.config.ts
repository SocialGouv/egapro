import { defineConfig } from "cypress";

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  defaultCommandTimeout: 30000,
  experimentalStudio: true,
  e2e: {
    baseUrl: "http://localhost:3000",
    setupNodeEvents(_on, _config) {
      // implement node event listeners here
    },
    experimentalRunAllSpecs: true,
    experimentalWebKitSupport: true,
    defaultCommandTimeout: 30000,
    pageLoadTimeout: 100000,
    responseTimeout: 30000,
    requestTimeout: 30000,
    viewportWidth: 1600,
    viewportHeight: 1400,
  },
});
