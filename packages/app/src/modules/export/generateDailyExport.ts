import "server-only";

import { eq } from "drizzle-orm";

import type { DB } from "~/server/db";
import { exports } from "~/server/db/schema";
import { ensureBucket, uploadFile } from "~/server/services/s3";
import { buildExportRows } from "./buildExportRows";
import { generateCsv } from "./generateCsv";
import { EXPORT_VERSION } from "./shared/constants";

type ExportResult = {
	fileName: string;
	rowCount: number;
	alreadyExists: boolean;
};

/**
 * Build the S3 object key for an export file.
 * Convention: exports/{version}/{YYYY-MM-DD}.csv
 */
export function buildExportKey(date: string, version: string): string {
	return `exports/${version}/${date}.csv`;
}

/**
 * Generate the daily export file for a given date and upload it to S3.
 * Stores metadata in the database for API retrieval.
 *
 * If an export already exists for the given date and version, it is skipped
 * (idempotent behavior for safe cron retries).
 */
export async function generateDailyExport(
	db: DB,
	date: string,
): Promise<ExportResult> {
	const fileName = `egapro_export_${date.replace(/-/g, "")}.csv`;

	const existing = await db
		.select({ id: exports.id })
		.from(exports)
		.where(eq(exports.date, date))
		.limit(1);

	if (existing.length > 0) {
		return { fileName, rowCount: 0, alreadyExists: true };
	}

	const rows = await buildExportRows(db, date);
	const csvContent = generateCsv(rows);

	const s3Key = buildExportKey(date, EXPORT_VERSION);
	await ensureBucket();
	await uploadFile(s3Key, Buffer.from(csvContent, "utf-8"), "text/csv");

	await db.insert(exports).values({
		date,
		version: EXPORT_VERSION,
		fileName,
		s3Key,
		rowCount: rows.length,
	});

	return { fileName, rowCount: rows.length, alreadyExists: false };
}
