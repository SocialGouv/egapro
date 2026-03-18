import { z } from "zod";

import { downloadExport } from "~/modules/export/downloadExport";
import { db } from "~/server/db";

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

		const result = await downloadExport(db, parsed.data.year);

		if (!result.found) {
			return Response.json(
				{ error: `No export found for year ${parsed.data.year}` },
				{ status: 404 },
			);
		}

		return new Response(result.body, {
			headers: {
				"Content-Type": result.contentType,
				"Content-Disposition": `attachment; filename="${result.fileName}"`,
			},
		});
	} catch (error) {
		console.error("[export/download] Failed:", error);
		return Response.json({ error: "Export download failed" }, { status: 500 });
	}
}
