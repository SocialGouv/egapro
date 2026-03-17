import { z } from "zod";

import { generateDailyExport } from "~/modules/export";
import { db } from "~/server/db";

const querySchema = z.object({
	date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format")
		.optional(),
});

/**
 * POST /api/export/generate
 *
 * Trigger daily export generation. Called by cron job or manually.
 * Optional query param `date` (YYYY-MM-DD) — defaults to yesterday.
 */
export async function POST(request: Request) {
	try {
		const url = new URL(request.url);
		const parsed = querySchema.safeParse({
			date: url.searchParams.get("date") ?? undefined,
		});

		if (!parsed.success) {
			return Response.json(
				{ error: parsed.error.issues[0]?.message },
				{ status: 400 },
			);
		}

		const date = parsed.data.date ?? getYesterday();
		const result = await generateDailyExport(db, date);

		return Response.json({
			success: true,
			date,
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

function getYesterday(): string {
	const d = new Date();
	d.setUTCDate(d.getUTCDate() - 1);
	return d.toISOString().slice(0, 10);
}
