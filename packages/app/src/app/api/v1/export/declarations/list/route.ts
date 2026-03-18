import { desc } from "drizzle-orm";

import { db } from "~/server/db";
import { exports } from "~/server/db/schema";

/**
 * GET /api/v1/export/declarations/list
 *
 * Public API to list all available daily export files.
 * Returns metadata (date, fileName, rowCount, createdAt) ordered by date descending.
 */
export async function GET() {
	try {
		const records = await db
			.select({
				date: exports.date,
				version: exports.version,
				fileName: exports.fileName,
				rowCount: exports.rowCount,
				createdAt: exports.createdAt,
			})
			.from(exports)
			.orderBy(desc(exports.date));

		return Response.json({
			exports: records,
			count: records.length,
		});
	} catch (error) {
		console.error("[api/v1/export/declarations/list] Failed:", error);
		return Response.json({ error: "Failed to list exports" }, { status: 500 });
	}
}
