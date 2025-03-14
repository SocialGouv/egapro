import { defineConfig } from "cypress";

import { sql as _sql } from "./src/api/shared-domain/infra/db/postgres";

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
        async cleanDB() {
          try {
            console.log("CLEAN START");
            console.log("resultDeclaration start");
            const listDeclaration = await _sql`select * from declaration`;
            console.log("resultDeclaration end", JSON.stringify(listDeclaration));
            console.log("resultDeclaration start");
            const resultDeclaration = await _sql`delete from declaration`;
            console.log("resultDeclaration end", JSON.stringify(resultDeclaration));
            console.log("resultOwnership start");
            const resultOwnership = await _sql`delete from ownership`;
            console.log("resultOwnership end", JSON.stringify(resultOwnership));
            console.log("CLEAN DONE");
            return true;
          } catch (e) {
            const m = JSON.stringify(e);
            console.log("CLEAN FAILED", m);
            return false;
          }
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
