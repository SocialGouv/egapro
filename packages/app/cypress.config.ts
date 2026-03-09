import { defineConfig } from "cypress";

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  defaultCommandTimeout: 30000,
  experimentalStudio: true,
  video: !!process.env.CI,
  screenshotOnRunFailure: true,
  retries: {
    runMode: 2, // Réessayer 2 fois en mode CI
    openMode: 0, // Pas de réessai en mode interactif
  },
  e2e: {
    setupNodeEvents(on) {
      on("before:browser:launch", (browser, launchOptions) => {
        if (browser.family === "chromium") {
          // Suppress ResizeObserver loop errors in Chromium 128+
          launchOptions.args.push("--disable-features=ResizeObserverReportUndeliveredNotifications");
        }
        return launchOptions;
      });
    },
    baseUrl: process.env.TEST_BASEURL ?? "http://localhost:3000",
    env: {
      E2E_USERNAME: process.env.E2E_USERNAME || "test@fia1.fr",
      E2E_PASSWORD: process.env.E2E_PASSWORD || "test",
      KEYCLOAK_URL: process.env.KEYCLOAK_URL || "http://localhost:8180",
    },
    experimentalRunAllSpecs: true,
    experimentalWebKitSupport: true,
    defaultCommandTimeout: 30000,
    pageLoadTimeout: 60000,
    responseTimeout: 30000,
    requestTimeout: 30000,
    viewportWidth: 1600,
    viewportHeight: 1400,
  },
});
