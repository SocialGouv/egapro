import { renderToBuffer } from "@react-pdf/renderer";
import { and, eq } from "drizzle-orm";

import { AUDIT_ACTIONS } from "~/modules/audit";
import {
	type PrefillPdfData,
	PrefillPdfDocument,
} from "~/modules/declarationPdf/PrefillPdfDocument";
import { getCurrentYear } from "~/modules/domain";
import { auditQueryMetadata } from "~/server/audit/queryMetadata";
import { withAuditedRoute } from "~/server/audit/withAuditedRoute";
import { getSessionSiren } from "~/server/auth/sessionSiren";
import { db } from "~/server/db";
import { companies, gipMdsData } from "~/server/db/schema";
import {
	invalidYearResponse,
	parseRequestedYear,
	pdfErrorResponse,
	pdfHeaders,
	renderPdfAndCacheSize,
	resolvePdfSize,
} from "~/server/pdf/pdfRoute";

const ROUTE = "prefill-pdf";

const resolveAuditContext = async (request: Request) => {
	const { session, siren } = await getSessionSiren(request);
	return {
		userId: session?.user?.id ?? null,
		userEmail: session?.user?.email ?? null,
		siren,
		metadata: auditQueryMetadata(parseRequestedYear(request), ({ year }) => ({
			year,
		})),
	};
};

type ResolvedPrefillPdf =
	| { error: Response }
	| { data: PrefillPdfData; filename: string; error?: undefined };

async function resolvePrefillPdf(
	request: Request,
): Promise<ResolvedPrefillPdf> {
	const { siren } = await getSessionSiren(request);
	if (!siren) {
		return { error: pdfErrorResponse("Non autorisé", 401) };
	}

	const requestedYear = parseRequestedYear(request);
	if (!requestedYear.success) {
		return { error: invalidYearResponse() };
	}
	const year = requestedYear.data.year ?? getCurrentYear();

	const [row] = await db
		.select()
		.from(gipMdsData)
		.where(and(eq(gipMdsData.siren, siren), eq(gipMdsData.year, year)))
		.limit(1);

	if (!row) {
		return { error: pdfErrorResponse("Aucune donnée préremplie", 404) };
	}

	const [company] = await db
		.select({ name: companies.name })
		.from(companies)
		.where(eq(companies.siren, siren))
		.limit(1);

	const data: PrefillPdfData = {
		siren,
		companyName: company?.name ?? `Entreprise ${siren}`,
		year,
		periodStart: row.periodStart,
		periodEnd: row.periodEnd,
		row: row as unknown as Record<string, string | number | null>,
	};

	return { data, filename: `donnees-preremplies-${siren}-${year}.pdf` };
}

export const GET = withAuditedRoute(
	{
		action: AUDIT_ACTIONS.PDF_PREFILL_DOWNLOAD,
		resolveContext: resolveAuditContext,
	},
	async (request) => {
		try {
			const resolved = await resolvePrefillPdf(request);
			if (resolved.error) return resolved.error;

			const body = await renderPdfAndCacheSize(ROUTE, resolved.data, () =>
				renderToBuffer(PrefillPdfDocument({ data: resolved.data })),
			);

			return new Response(body, {
				headers: pdfHeaders(resolved.filename, body.byteLength),
			});
		} catch (error) {
			console.error("[prefill-pdf]", error);
			return pdfErrorResponse("Impossible de générer le PDF", 500);
		}
	},
);

export const HEAD = withAuditedRoute(
	{
		action: AUDIT_ACTIONS.PDF_SIZE_PROBE,
		resolveContext: resolveAuditContext,
	},
	async (request) => {
		try {
			const resolved = await resolvePrefillPdf(request);
			if (resolved.error) {
				return pdfErrorResponse(null, resolved.error.status);
			}

			const size = await resolvePdfSize(ROUTE, resolved.data, () =>
				renderToBuffer(PrefillPdfDocument({ data: resolved.data })),
			);

			return new Response(null, {
				headers: pdfHeaders(resolved.filename, size),
			});
		} catch (error) {
			console.error("[prefill-pdf:head]", error);
			return pdfErrorResponse(null, 500);
		}
	},
);
