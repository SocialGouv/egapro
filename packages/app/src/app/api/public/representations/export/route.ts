import { NextResponse } from "next/server";
import { AUDIT_ACTIONS } from "~/modules/audit";
import {
	buildRepresentationExportRows,
	generateRepresentationXlsx,
} from "~/modules/export";
import { withAuditedRoute } from "~/server/audit/withAuditedRoute";
import { db } from "~/server/db";

export const GET = withAuditedRoute(
	{
		action: AUDIT_ACTIONS.PUBLIC_REPRESENTATIONS_EXPORT,
	},
	async () => {
		try {
			const rows = await buildRepresentationExportRows(db);
			const xlsxBuffer = await generateRepresentationXlsx(rows);

			return new NextResponse(new Uint8Array(xlsxBuffer), {
				headers: {
					"Content-Type":
						"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
					"Content-Disposition":
						'attachment; filename="representation_equilibree_export.xlsx"',
					"Access-Control-Allow-Origin": "*",
					"Cache-Control": "public, max-age=3600, s-maxage=3600",
				},
			});
		} catch (error) {
			console.error(
				"[api/public/representations/export]",
				error instanceof Error ? error.message : "unknown error",
			);
			return NextResponse.json(
				{ error: "Erreur lors de l'export des représentations équilibrées" },
				{ status: 500 },
			);
		}
	},
);
