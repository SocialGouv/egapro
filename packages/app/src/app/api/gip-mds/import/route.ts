import { env } from "~/env.js";
import { db } from "~/server/db";
import { fetchGipCsv, importGipCsvToDb } from "~/server/services/gipMds";

/**
 * POST /api/gip-mds/import
 *
 * Trigger GIP MDS CSV import from the configured API URL.
 * Called by the deployment job (dev/review environments) or manually.
 */
export async function POST() {
	const url = env.EGAPRO_GIP_MDS_API_URL;
	if (!url) {
		return Response.json(
			{ error: "EGAPRO_GIP_MDS_API_URL is not configured" },
			{ status: 412 },
		);
	}

	try {
		const csvContent = await fetchGipCsv(url);
		const result = await importGipCsvToDb(db, csvContent);

		return Response.json({
			success: true,
			...result,
		});
	} catch (error) {
		console.error("[gip-mds/import] Failed:", error);
		return Response.json(
			{
				error: error instanceof Error ? error.message : "GIP MDS import failed",
			},
			{ status: 500 },
		);
	}
}
