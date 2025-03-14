import { defineConfig } from "cypress";
import postgres from "postgres";

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
      _on("task", {
        cleanDB() {
          console.log(process.env.POSTGRES_HOST);
          const _sql = postgres({
            debug: true,
            host: process.env.POSTGRES_HOST ?? "",
            port: parseInt(process.env.POSTGRES_PORT ?? "") ?? 0,
            database: process.env.POSTGRES_DB ?? "",
            username: process.env.POSTGRES_USER ?? "",
            password: process.env.POSTGRES_PASSWORD ?? "",
            ssl: "prefer",
          });
          return _sql`delete from declaration`;
        },
      });
    },
    experimentalRunAllSpecs: true,
    experimentalWebKitSupport: true,
    defaultCommandTimeout: 120000,
    pageLoadTimeout: 120000,
    responseTimeout: 120000,
    requestTimeout: 120000,
    viewportWidth: 1600,
    viewportHeight: 1400,
  },
});
