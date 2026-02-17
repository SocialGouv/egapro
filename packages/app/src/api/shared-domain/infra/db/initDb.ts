import { sql } from "./postgres";

/**
 * Initialise le schéma de la base de données en créant les tables nécessaires
 * si elles n'existent pas. Ce script est idempotent et peut être exécuté
 * plusieurs fois sans risque.
 *
 * Exécuté automatiquement au démarrage de l'application via instrumentation.ts.
 */
export async function initDb() {
  try {
    // Suppress NOTICE messages (e.g. "relation already exists, skipping")
    await sql.unsafe(`SET client_min_messages TO WARNING`);

    // Extensions et text search config nécessitent des privilèges élevés.
    // En environnement CNPG, elles sont déjà installées par le superuser.
    try {
      await sql.unsafe(`CREATE EXTENSION IF NOT EXISTS unaccent`);
      await sql.unsafe(`
        DO
        $$BEGIN
            CREATE TEXT SEARCH CONFIGURATION ftdict (COPY=simple);
            ALTER TEXT SEARCH CONFIGURATION ftdict ALTER MAPPING FOR hword, hword_part, word WITH unaccent, simple;
        EXCEPTION
          WHEN unique_violation THEN
              NULL;
        END;$$
      `);
    } catch {
      // OK: insufficient privileges, extensions already installed by superuser
    }

    // Tables principales
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS representation_equilibree
      (siren TEXT, year INT, modified_at TIMESTAMP WITH TIME ZONE, declared_at TIMESTAMP WITH TIME ZONE, data JSONB, ft TSVECTOR,
      PRIMARY KEY (siren, year));

      CREATE TABLE IF NOT EXISTS search_representation_equilibree
      (siren TEXT, year INT, declared_at TIMESTAMP WITH TIME ZONE, ft TSVECTOR, region VARCHAR(2), departement VARCHAR(3), section_naf CHAR,
      PRIMARY KEY (siren, year));

      CREATE INDEX IF NOT EXISTS idx_email ON representation_equilibree((data->'déclarant'->>'email'));
      CREATE INDEX IF NOT EXISTS idx_siren ON representation_equilibree(siren);
    `);

    // FK constraint (peut échouer si l'utilisateur n'est pas propriétaire de la table)
    try {
      await sql.unsafe(`
        ALTER TABLE search_representation_equilibree DROP CONSTRAINT IF EXISTS representation_equilibree_exists;
        ALTER TABLE search_representation_equilibree ADD CONSTRAINT representation_equilibree_exists FOREIGN KEY (siren,year) REFERENCES representation_equilibree(siren,year) ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    } catch {
      // OK: constraint already exists or insufficient privileges
    }

    console.log("[initDb] Database schema initialized successfully.");
  } catch (error) {
    console.error("[initDb] Failed to initialize database schema:", error);
    throw error;
  }
}
