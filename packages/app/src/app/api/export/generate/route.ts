import { z } from "zod";

import { generateYearlyExport } from "~/modules/export";
import { db } from "~/server/db";

const querySchema = z.object({
	year: z
		.string()
		.regex(/^\d{4}$/, "Year must be YYYY format")
		.transform(Number)
		.optional(),
});

/**
 * POST /api/export/generate
 *
 * Trigger yearly export XLSX generation. Called by cron job or manually.
 * Optional query param `year` (YYYY) — defaults to current year.
 */
export async function POST(request: Request) {
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

		const year = parsed.data.year ?? new Date().getUTCFullYear();
		const result = await generateYearlyExport(db, year);

		return Response.json({
			success: true,
			year,
			...result,
		});
	} catch (error) {
		console.error("[export/generate] Failed:", error);
		return Response.json(
			{ error: "Export generation failed" },
			{ status: 500 },
		);
	}
}
