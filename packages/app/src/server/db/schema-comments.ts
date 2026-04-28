/**
 * Column-level documentation attached to the DB schema and rendered on the
 * wiki (https://github.com/SocialGouv/egapro/wiki/Schema-Egapro-V2) by the
 * `db-schema.yaml` workflow via `scripts/post-process-schema-wiki.ts`.
 *
 * Key = lowercase table name as produced by db-schema-toolkit (without the
 * `app_` prefix, matching the "Table: <name>" section headers in the Markdown).
 * Value = map of snake_case column name → human-readable comment.
 * Column names must be snake_case (e.g. `indicator_a_annual_women`) — the
 * post-processing script converts camelCase column names from the Markdown to
 * snake_case before lookup.
 *
 * Populated in tickets T1 (indicators A–F, GIP-MDS origin) and T2 (other
 * SUIT-exposed columns: company identity, declarant, CSE, files, indicator G).
 */
export type SchemaColumnComments = Record<string, Record<string, string>>;

export const SCHEMA_COLUMN_COMMENTS: SchemaColumnComments = {
	// Filled by tickets T1 and T2.
};
