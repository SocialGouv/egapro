import { AUDIT_ACTIONS } from "~/modules/audit";
import { downloadExport } from "~/modules/export/downloadExport";
import { exportYearQuerySchema } from "~/modules/export/schemas";
import { auditQueryMetadata } from "~/server/audit/queryMetadata";
import { withAuditedRoute } from "~/server/audit/withAuditedRoute";
import { db } from "~/server/db";

/**
 * GET /api/export/download?year=2026
 *
 * Download the yearly XLSX export file for a given year.
 */
export const GET = withAuditedRoute(
	{
		action: AUDIT_ACTIONS.EXPORT_DOWNLOAD,
		resolveContext: (request) => {
			const url = new URL(request.url);
			return {
				metadata: auditQueryMetadata(
					exportYearQuerySchema.safeParse({
						year: url.searchParams.get("year") ?? undefined,
					}),
					(query) => ({ year: query.year }),
				),
			};
		},
	},
	exportDownloadHandler,
);

async function exportDownloadHandler(request: Request): Promise<Response> {
	try {
		const url = new URL(request.url);
		const parsed = exportYearQuerySchema.safeParse({
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
