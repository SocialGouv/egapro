import { defineConfig } from "cypress";

export default defineConfig({
  defaultCommandTimeout: 30000,
  experimentalStudio: true,
  e2e: {
    baseUrl: "http://localhost:3000",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
