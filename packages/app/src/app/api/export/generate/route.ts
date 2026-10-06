import { env } from "~/env.js";
import { AUDIT_ACTIONS } from "~/modules/audit";
import { getCurrentYear } from "~/modules/domain";
import { generateYearlyExport } from "~/modules/export";
import {
	auditedExportYear,
	exportYearOptionalQuerySchema,
} from "~/modules/export/schemas";
import { withAuditedRoute } from "~/server/audit/withAuditedRoute";
import { assertBearerToken } from "~/server/auth/bearerToken";
import { db } from "~/server/db";

/**
 * POST /api/export/generate
 *
 * Trigger yearly export XLSX generation. Called by the K8s CronJob.
 * Optional query param `year` (YYYY) — defaults to current year.
 */
export const POST = withAuditedRoute(
	{
		action: AUDIT_ACTIONS.EXPORT_GENERATE,
		resolveContext: (request) => ({
			metadata: { year: auditedExportYear(request) },
		}),
	},
	exportGenerateHandler,
);

async function exportGenerateHandler(request: Request): Promise<Response> {
	const unauthorized = assertBearerToken(request, {
		expectedToken: env.EGAPRO_EXPORT_API_TOKEN,
		tokenName: "EGAPRO_EXPORT_API_TOKEN",
	});
	if (unauthorized) {
		return unauthorized;
	}

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

		const year = parsed.data.year ?? getCurrentYear();
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
