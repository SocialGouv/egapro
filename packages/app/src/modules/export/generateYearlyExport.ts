import "server-only";

import { and, eq } from "drizzle-orm";

import type { DB } from "~/server/db";
import { exports } from "~/server/db/schema";
import { ensureBucket, uploadFile } from "~/server/services/s3";
import { buildExportRows, buildIndicatorGRows } from "./buildExportRows";
import { generateXlsx } from "./generateXlsx";
import { EXPORT_VERSION } from "./shared/constants";

type ExportResult = {
	fileName: string;
	rowCount: number;
	indicatorGRowCount: number;
};

/**
 * Build the S3 object key for a yearly export file.
 * Convention: exports/{version}/{year}.xlsx
 */
export function buildExportKey(year: number, version: string): string {
	return `exports/${version}/${year}.xlsx`;
}

/**
 * Generate the yearly XLSX export for a given declaration year and upload to S3.
 * Stores/updates metadata in the database for API retrieval.
 *
 * Always regenerates (upsert) to capture newly submitted declarations.
 */
export async function generateYearlyExport(
	db: DB,
	year: number,
): Promise<ExportResult> {
	const fileName = `egapro_export_${year}.xlsx`;

	const declarationRows = await buildExportRows(db, year);
	const indicatorGRows = await buildIndicatorGRows(db, year);

	const xlsxBuffer = await generateXlsx(declarationRows, indicatorGRows);

	const s3Key = buildExportKey(year, EXPORT_VERSION);
	await ensureBucket();
	await uploadFile(
		s3Key,
		xlsxBuffer,
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	);

	const existing = await db
		.select({ id: exports.id })
		.from(exports)
		.where(and(eq(exports.year, year), eq(exports.version, EXPORT_VERSION)))
		.limit(1);

	if (existing.length > 0) {
		await db
			.update(exports)
			.set({
				fileName,
				s3Key,
				rowCount: declarationRows.length,
				createdAt: new Date(),
			})
			.where(and(eq(exports.year, year), eq(exports.version, EXPORT_VERSION)));
	} else {
		await db.insert(exports).values({
			year,
			version: EXPORT_VERSION,
			fileName,
			s3Key,
			rowCount: declarationRows.length,
		});
	}

	return {
		fileName,
		rowCount: declarationRows.length,
		indicatorGRowCount: indicatorGRows.length,
	};
}
