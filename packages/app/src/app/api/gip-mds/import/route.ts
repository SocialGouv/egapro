import { env } from "~/env.js";
import { db } from "~/server/db";
import { fetchGipCsv, importGipCsvToDb } from "~/server/services/gipMds";

/**
 * POST /api/gip-mds/import
 *
 * Trigger GIP MDS CSV import from the configured API URL.
 * Called by the K8s CronJob with a Bearer token for authentication.
 */
export async function POST(request: Request) {
	const token = env.EGAPRO_GIP_MDS_API_TOKEN;
	if (token) {
		const authHeader = request.headers.get("authorization");
		if (authHeader !== `Bearer ${token}`) {
			return Response.json({ error: "Unauthorized" }, { status: 401 });
		}
	}

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
