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
    experimentalRunAllSpecs: true,
    experimentalWebKitSupport: true,
    defaultCommandTimeout: 120000,
    pageLoadTimeout: 180000,
    responseTimeout: 120000,
    requestTimeout: 120000,
    viewportWidth: 1600,
    viewportHeight: 1400,
  },
});
