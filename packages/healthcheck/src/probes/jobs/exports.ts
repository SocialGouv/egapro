import type { Sql } from "postgres";

type ExportArchiveRow = {
	lastGeneratedAt: Date | null;
};

/**
 * Whether a yearly export archive was actually written inside the window.
 *
 * `export.generate` returns 200 from the route, but the audit line alone does
 * not prove the XLSX exists: the row in `app_export` is the artefact. A success
 * line with no archive behind it is a green light for a job that produced
 * nothing.
 *
 * The recency comes from `generated_at`, not `created_at`: the daily CronJob
 * upserts the same `(year, version)` row, and `created_at` is only set on the
 * first insert of the year.
 */
export async function hasRecentExportArchive(
	sql: Sql,
	since: Date,
): Promise<boolean> {
	const rows = await sql<ExportArchiveRow[]>`
		SELECT max(generated_at) AS "lastGeneratedAt"
		FROM app_export
		WHERE generated_at >= ${since}
	`;

	return rows[0]?.lastGeneratedAt != null;
}
