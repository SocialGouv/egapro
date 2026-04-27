/**
 * Column-level documentation attached to the DB schema and rendered on the
 * wiki (https://github.com/SocialGouv/egapro/wiki/Schema-Egapro-V2) by the
 * `db-schema.yaml` workflow via `scripts/post-process-schema-wiki.mjs`.
 *
 * Key = Drizzle snake_case table name (without the `app_` prefix).
 * Value = map of snake_case column name → human-readable comment.
 *
 * Populated in tickets T1 (indicators A–F, GIP-MDS origin) and T2 (other
 * SUIT-exposed columns: company identity, declarant, CSE, files, indicator G).
 */
export type SchemaColumnComments = Record<string, Record<string, string>>;

export const SCHEMA_COLUMN_COMMENTS: SchemaColumnComments = {
	// Filled by tickets T1 and T2.
};
