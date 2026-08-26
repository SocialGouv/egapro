import { NextResponse } from "next/server";
import { z } from "zod";
import { AUDIT_ACTIONS } from "~/modules/audit";
import {
	buildRepresentationExportRows,
	generateRepresentationCsv,
	generateRepresentationXlsx,
} from "~/modules/export";
import { withAuditedRoute } from "~/server/audit/withAuditedRoute";
import { db } from "~/server/db";
import { enforcePublicApiRateLimit } from "~/server/services/publicApiRateLimit";

const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Defaults to xlsx: this endpoint shipped as an Excel-only download and
// existing callers pass no format at all.
const FORMAT_SCHEMA = z.enum(["csv", "xlsx"]).default("xlsx");

export function OPTIONS(): Response {
	return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export const GET = withAuditedRoute(
	{
		action: AUDIT_ACTIONS.PUBLIC_REPRESENTATIONS_EXPORT,
		resolveContext: (request) => {
			const raw = new URL(request.url).searchParams.get("format") ?? "xlsx";
			const parsed = FORMAT_SCHEMA.safeParse(raw);
			return { metadata: { format: parsed.success ? parsed.data : raw } };
		},
	},
	async (request) => {
		try {
			const limited = await enforcePublicApiRateLimit(request);
			if (limited) return limited;
			const format = FORMAT_SCHEMA.safeParse(
				new URL(request.url).searchParams.get("format") ?? "xlsx",
			);
			if (!format.success) {
				return NextResponse.json(
					{ error: "Le paramètre format doit être 'csv' ou 'xlsx'" },
					{ status: 400, headers: CORS_HEADERS },
				);
			}
			const rows = await buildRepresentationExportRows(db);

			if (format.data === "csv") {
				return new NextResponse(generateRepresentationCsv(rows), {
					headers: {
						"Content-Type": "text/csv; charset=utf-8",
						"Content-Disposition":
							'attachment; filename="representation_equilibree_export.csv"',
						...CORS_HEADERS,
						"Cache-Control": "public, max-age=3600, s-maxage=3600",
					},
				});
			}

			const xlsxBuffer = await generateRepresentationXlsx(rows);

			return new NextResponse(new Uint8Array(xlsxBuffer), {
				headers: {
					"Content-Type":
						"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
					"Content-Disposition":
						'attachment; filename="representation_equilibree_export.xlsx"',
					...CORS_HEADERS,
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
				{ status: 500, headers: CORS_HEADERS },
			);
		}
	},
);
