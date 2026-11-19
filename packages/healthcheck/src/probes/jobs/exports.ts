import type { Sql } from "postgres";

type ExportArchiveRow = {
	lastCreatedAt: Date | null;
};

/**
 * Whether a yearly export archive was actually written inside the window.
 *
 * `export.generate` returns 200 from the route, but the audit line alone does
 * not prove the XLSX exists: the row in `app_export` is the artefact. A success
 * line with no archive behind it is a green light for a job that produced
 * nothing.
 */
export async function hasRecentExportArchive(
	sql: Sql,
	since: Date,
): Promise<boolean> {
	const rows = await sql<ExportArchiveRow[]>`
		SELECT max(created_at) AS "lastCreatedAt"
		FROM app_export
		WHERE created_at >= ${since}
	`;

	return rows[0]?.lastCreatedAt != null;
}
