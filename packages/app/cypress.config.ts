import { defineConfig } from "cypress";
import postgres from "postgres";

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
    setupNodeEvents(on, config) {
      on("task", {
        async deleteTestDeclaration({
          siren,
          year,
        }: {
          siren: string;
          year: number;
        }) {
          const sql = postgres({
            host: process.env.POSTGRES_HOST || "localhost",
            port: parseInt(process.env.POSTGRES_PORT || "5438"),
            database: process.env.POSTGRES_DB || "egapro",
            username: process.env.POSTGRES_USER || "postgres",
            password: process.env.POSTGRES_PASSWORD || "postgres",
          });

          try {
            // Vérifier si la ligne existe
            const existingRows =
              await sql`SELECT 1 FROM representation_equilibree WHERE siren = ${siren} AND year = ${year} LIMIT 1`;

            if (existingRows.length === 0) {
              throw new Error(
                `Aucune déclaration trouvée pour le SIREN ${siren} et l'année ${year}`,
              );
            }

            // Supprimer la ligne
            await sql`DELETE FROM representation_equilibree WHERE siren = ${siren} AND year = ${year}`;
            return true;
          } catch (error) {
            console.error(
              "Erreur lors de la suppression de la déclaration:",
              error,
            );
            throw error; // Remonter l'erreur pour que Cypress la capture
          } finally {
            await sql.end();
          }
        },
      });
      return config;
    },
  },
});
