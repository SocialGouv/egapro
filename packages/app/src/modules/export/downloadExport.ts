import "server-only";

import { and, eq } from "drizzle-orm";

import type { DB } from "~/server/db";
import { exports } from "~/server/db/schema";
import { getFile } from "~/server/services/s3";
import { EXPORT_VERSION } from "./shared/constants";

type DownloadResult =
	| { found: true; fileName: string; body: ReadableStream; contentType: string }
	| { found: false };

/**
 * Look up the export metadata for a given year and stream the file from S3.
 */
export async function downloadExport(
	db: DB,
	year: number,
): Promise<DownloadResult> {
	const [exportRow] = await db
		.select({ s3Key: exports.s3Key, fileName: exports.fileName })
		.from(exports)
		.where(and(eq(exports.year, year), eq(exports.version, EXPORT_VERSION)))
		.limit(1);

	if (!exportRow) {
		return { found: false };
	}

	const { body, contentType } = await getFile(exportRow.s3Key);

	return { found: true, fileName: exportRow.fileName, body, contentType };
}
