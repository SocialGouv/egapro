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
      E2E_USERNAME: process.env.E2E_USERNAME || "testuser",
      E2E_PASSWORD: process.env.E2E_PASSWORD || "password",
      E2E_CLEANUP_TOKEN: process.env.E2E_CLEANUP_TOKEN,
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
          const baseUrl = process.env.TEST_BASEURL || "http://localhost:3000";
          const cleanupToken = process.env.E2E_CLEANUP_TOKEN;

          // Méthode 1: Appel API (préférée pour les environnements distants)
          if (cleanupToken) {
            try {
              const response = await fetch(`${baseUrl}/api/test/cleanup`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${cleanupToken}`,
                },
                body: JSON.stringify({ siren, year }),
              });

              const data = await response.json();

              if (!response.ok) {
                console.error(
                  `❌ Erreur lors de la suppression via API (${response.status}):`,
                  data,
                );
                return null;
              }

              console.log(`✅ ${data.message}`);
              return true;
            } catch (error) {
              console.error(
                "❌ Erreur lors de l'appel à l'API de cleanup:",
                error,
              );
              return null;
            }
          }

          // Méthode 2: Connexion directe PostgreSQL (pour tests locaux uniquement)
          if (process.env.POSTGRES_HOST) {
            const sql = postgres({
              host: process.env.POSTGRES_HOST,
              port: parseInt(process.env.POSTGRES_PORT || "5432"),
              database: process.env.POSTGRES_DB || "egapro",
              username: process.env.POSTGRES_USER || "postgres",
              password: process.env.POSTGRES_PASSWORD || "postgres",
            });

            try {
              const existingRows =
                await sql`SELECT 1 FROM representation_equilibree WHERE siren = ${siren} AND year = ${year} LIMIT 1`;

              if (existingRows.length === 0) {
                console.log(
                  `ℹ️ Aucune déclaration trouvée pour le SIREN ${siren} et l'année ${year}`,
                );
                return null;
              }

              await sql`DELETE FROM representation_equilibree WHERE siren = ${siren} AND year = ${year}`;
              console.log(
                `✅ Déclaration supprimée (DB directe): SIREN ${siren}, année ${year}`,
              );
              return true;
            } catch (error) {
              console.error(
                "❌ Erreur lors de la suppression via DB:",
                error,
              );
              return null;
            } finally {
              await sql.end();
            }
          }

          // Aucune méthode de cleanup disponible
          console.log(
            "⚠️ Aucune méthode de cleanup disponible (E2E_CLEANUP_TOKEN ou POSTGRES_HOST requis)",
          );
          return null;
        },
      });
      return config;
    },
  },
});
