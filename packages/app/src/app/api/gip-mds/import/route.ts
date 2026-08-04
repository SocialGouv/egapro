import { env } from "~/env.js";
import { AUDIT_ACTIONS } from "~/modules/audit";
import { withAuditedRoute } from "~/server/audit/withAuditedRoute";
import { db } from "~/server/db";
import { fetchGipCsv, importGipCsvToDb } from "~/server/services/gipMds";

/**
 * POST /api/gip-mds/import
 *
 * Trigger GIP MDS CSV import from the configured API URL.
 * Called by the K8s CronJob with a Bearer token for authentication.
 */
export const POST = withAuditedRoute(
	{ action: AUDIT_ACTIONS.GIP_MDS_IMPORT },
	gipMdsImportHandler,
);

async function gipMdsImportHandler(request: Request): Promise<Response> {
	// Fail closed. Skipping the check when the token is unset would turn this
	// into an unauthenticated import the day EGAPRO_GIP_MDS_API_URL points at
	// the real SUIT endpoint in an environment where the secret was forgotten.
	const token = env.EGAPRO_GIP_MDS_API_TOKEN;
	if (!token) {
		console.error(
			"[gip-mds/import] EGAPRO_GIP_MDS_API_TOKEN is not configured — refusing",
		);
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${token}`) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
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
