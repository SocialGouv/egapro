import { defineConfig } from "cypress";

export default defineConfig({
  defaultCommandTimeout: 10000,
  experimentalStudio: true,
  e2e: {
    baseUrl: "http://localhost:3000",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
