import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { EXPORT_VERSION } from "~/modules/export";
import { db } from "~/server/db";
import { exports } from "~/server/db/schema";
import { getFile } from "~/server/services/s3";

const querySchema = z.object({
	year: z
		.string()
		.regex(/^\d{4}$/, "Year must be YYYY format")
		.transform(Number),
});

/**
 * GET /api/export/download?year=2026
 *
 * Download the yearly XLSX export file for a given year.
 */
export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const parsed = querySchema.safeParse({
			year: url.searchParams.get("year") ?? undefined,
		});

		if (!parsed.success) {
			return Response.json(
				{ error: parsed.error.issues[0]?.message },
				{ status: 400 },
			);
		}

		const { year } = parsed.data;

		const [exportRow] = await db
			.select({ s3Key: exports.s3Key, fileName: exports.fileName })
			.from(exports)
			.where(and(eq(exports.year, year), eq(exports.version, EXPORT_VERSION)))
			.limit(1);

		if (!exportRow) {
			return Response.json(
				{ error: `No export found for year ${year}` },
				{ status: 404 },
			);
		}

		const { body, contentType } = await getFile(exportRow.s3Key);

		return new Response(body, {
			headers: {
				"Content-Type": contentType,
				"Content-Disposition": `attachment; filename="${exportRow.fileName}"`,
			},
		});
	} catch (error) {
		console.error("[export/download] Failed:", error);
		return Response.json({ error: "Export download failed" }, { status: 500 });
	}
}
