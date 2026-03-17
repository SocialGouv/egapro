import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "~/server/db";
import { exports } from "~/server/db/schema";
import { getFile } from "~/server/services/s3";

const querySchema = z.object({
	date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
});

/**
 * GET /api/v1/export/declarations?date=YYYY-MM-DD
 *
 * Public API to download the daily export CSV file.
 * Streams the file directly from S3.
 */
export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const parsed = querySchema.safeParse({
			date: url.searchParams.get("date") ?? undefined,
		});

		if (!parsed.success) {
			return Response.json(
				{ error: "Le paramètre 'date' est requis au format YYYY-MM-DD" },
				{ status: 400 },
			);
		}

		const { date } = parsed.data;

		const [exportEntry] = await db
			.select({ fileName: exports.fileName, s3Key: exports.s3Key })
			.from(exports)
			.where(eq(exports.date, date))
			.limit(1);

		if (!exportEntry) {
			return Response.json(
				{ error: `Aucun export disponible pour la date ${date}` },
				{ status: 404 },
			);
		}

		const { body, contentType } = await getFile(exportEntry.s3Key);

		return new Response(body, {
			headers: {
				"Content-Type": contentType,
				"Content-Disposition": `attachment; filename="${exportEntry.fileName}"`,
				"Cache-Control": "public, max-age=86400",
			},
		});
	} catch (error) {
		console.error("[api/v1/export/declarations]", error);
		return Response.json(
			{ error: "Erreur lors de la récupération de l'export" },
			{ status: 500 },
		);
	}
}
