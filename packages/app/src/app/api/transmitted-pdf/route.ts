import { renderToBuffer } from "@react-pdf/renderer";
import { AUDIT_ACTIONS } from "~/modules/audit";
import { buildTransmittedPdfData } from "~/modules/declarationPdf/buildTransmittedPdfData";
import { TransmittedPdfDocument } from "~/modules/declarationPdf/TransmittedPdfDocument";
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

const ROUTE = "transmitted-pdf";

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

type ResolvedTransmittedPdf =
	| { error: Response }
	| {
			data: Awaited<ReturnType<typeof buildTransmittedPdfData>>;
			filename: string;
			error?: undefined;
	  };

async function resolveTransmittedPdf(
	request: Request,
): Promise<ResolvedTransmittedPdf> {
	const { siren } = await getSessionSiren(request);
	if (!siren) {
		return { error: pdfErrorResponse("Non autorisé", 401) };
	}

	const requestedYear = parseRequestedYear(request);
	if (!requestedYear.success) {
		return { error: invalidYearResponse() };
	}
	const year = requestedYear.data.year ?? getCurrentYear();

	const data = await buildTransmittedPdfData(siren, year, new Date());

	return {
		data,
		filename: `recapitulatif-elements-transmis-${siren}-${data.year + 1}.pdf`,
	};
}

export const GET = withAuditedRoute(
	{
		action: AUDIT_ACTIONS.PDF_TRANSMITTED_DOWNLOAD,
		resolveContext: resolveAuditContext,
	},
	async (request) => {
		try {
			const resolved = await resolveTransmittedPdf(request);
			if (resolved.error) return resolved.error;

			const body = await renderPdfAndCacheSize(ROUTE, resolved.data, () =>
				renderToBuffer(TransmittedPdfDocument({ data: resolved.data })),
			);

			return new Response(body, {
				headers: pdfHeaders(resolved.filename, body.byteLength),
			});
		} catch (error) {
			console.error("[transmitted-pdf]", error);
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
			const resolved = await resolveTransmittedPdf(request);
			if (resolved.error) {
				return pdfErrorResponse(null, resolved.error.status);
			}

			const size = await resolvePdfSize(ROUTE, resolved.data, () =>
				renderToBuffer(TransmittedPdfDocument({ data: resolved.data })),
			);

			return new Response(null, {
				headers: pdfHeaders(resolved.filename, size),
			});
		} catch (error) {
			console.error("[transmitted-pdf:head]", error);
			return pdfErrorResponse(null, 500);
		}
	},
);
