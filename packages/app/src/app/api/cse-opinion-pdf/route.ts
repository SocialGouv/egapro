import { renderToBuffer } from "@react-pdf/renderer";
import { AUDIT_ACTIONS } from "~/modules/audit";
import {
	buildCseOpinionRecapData,
	CseOpinionNotTransmittedError,
	type CseOpinionRecapData,
	cseOpinionPdfFilename,
} from "~/modules/declarationPdf/buildCseOpinionRecapData";
import { CseOpinionPdfDocument } from "~/modules/declarationPdf/CseOpinionPdfDocument";
import { getCurrentYear } from "~/modules/domain";
import { auditQueryMetadata } from "~/server/audit/queryMetadata";
import { withAuditedRoute } from "~/server/audit/withAuditedRoute";
import { getSessionSiren } from "~/server/auth/sessionSiren";
import {
	invalidYearResponse,
	parseRequestedYear,
	pdfErrorResponse,
	pdfHeaders,
	renderPdfAndCacheSize,
	resolvePdfSize,
} from "~/server/pdf/pdfRoute";

const ROUTE = "cse-opinion-pdf";

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

type ResolvedCseOpinionPdf =
	| { error: Response }
	| { data: CseOpinionRecapData; filename: string; error?: undefined };

async function resolveCseOpinionPdf(
	request: Request,
): Promise<ResolvedCseOpinionPdf> {
	const { siren } = await getSessionSiren(request);
	if (!siren) {
		return { error: pdfErrorResponse("Non autorisé", 401) };
	}

	const requestedYear = parseRequestedYear(request);
	if (!requestedYear.success) {
		return { error: invalidYearResponse() };
	}
	const year = requestedYear.data.year ?? getCurrentYear();

	try {
		const data = await buildCseOpinionRecapData(siren, year);
		return { data, filename: cseOpinionPdfFilename(siren, year) };
	} catch (error) {
		if (error instanceof CseOpinionNotTransmittedError) {
			return {
				error: pdfErrorResponse("Avis du CSE non transmis", 404),
			};
		}
		throw error;
	}
}

const renderDocument = (data: CseOpinionRecapData) => () =>
	renderToBuffer(CseOpinionPdfDocument({ data }));

export const GET = withAuditedRoute(
	{
		action: AUDIT_ACTIONS.PDF_CSE_OPINION_DOWNLOAD,
		resolveContext: resolveAuditContext,
	},
	async (request) => {
		try {
			const resolved = await resolveCseOpinionPdf(request);
			if (resolved.error) return resolved.error;

			const body = await renderPdfAndCacheSize(
				ROUTE,
				resolved.data,
				renderDocument(resolved.data),
			);

			return new Response(body, {
				headers: pdfHeaders(resolved.filename, body.byteLength),
			});
		} catch (error) {
			console.error("[cse-opinion-pdf]", error);
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
			const resolved = await resolveCseOpinionPdf(request);
			if (resolved.error) {
				return pdfErrorResponse(null, resolved.error.status);
			}

			const size = await resolvePdfSize(
				ROUTE,
				resolved.data,
				renderDocument(resolved.data),
			);

			return new Response(null, {
				headers: pdfHeaders(resolved.filename, size),
			});
		} catch (error) {
			console.error("[cse-opinion-pdf:head]", error);
			return pdfErrorResponse(null, 500);
		}
	},
);
