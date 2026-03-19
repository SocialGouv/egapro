import { generateYearlyExport } from "~/modules/export";
import { exportYearOptionalQuerySchema } from "~/modules/export/schemas";
import { db } from "~/server/db";

/**
 * POST /api/export/generate
 *
 * Trigger yearly export XLSX generation. Called by cron job or manually.
 * Optional query param `year` (YYYY) — defaults to current year.
 */
export async function POST(request: Request) {
	try {
		const url = new URL(request.url);
		const parsed = exportYearOptionalQuerySchema.safeParse({
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
