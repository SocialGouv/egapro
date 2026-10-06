import { renderToBuffer } from "@react-pdf/renderer";
import { AUDIT_ACTIONS } from "~/modules/audit";
import { buildPdfData } from "~/modules/declarationPdf/buildPdfData";
import { DeclarationPdfDocument } from "~/modules/declarationPdf/DeclarationPdfDocument";
import { getCurrentYear } from "~/modules/domain";
import { withAuditedRoute } from "~/server/audit/withAuditedRoute";
import { getSessionSiren } from "~/server/auth/sessionSiren";
import {
	invalidYearResponse,
	pdfErrorResponse,
	pdfHeaders,
	readRequestedYear,
	renderPdfAndCacheSize,
	resolvePdfSize,
} from "~/server/pdf/pdfRoute";

const ROUTE = "declaration-pdf";

function readDeclarationType(request: Request): "correction" | "initial" {
	return new URL(request.url).searchParams.get("type") === "correction"
		? "correction"
		: "initial";
}

const resolveAuditContext = async (request: Request) => {
	const { session, siren } = await getSessionSiren(request);
	const requestedYear = readRequestedYear(request);
	return {
		userId: session?.user?.id ?? null,
		userEmail: session?.user?.email ?? null,
		siren,
		metadata: {
			year: requestedYear.year,
			invalidYear: requestedYear.invalid,
			type: readDeclarationType(request),
		},
	};
};

type ResolvedDeclarationPdf =
	| { error: Response }
	| {
			data: Awaited<ReturnType<typeof buildPdfData>>;
			filename: string;
			error?: undefined;
	  };

async function resolveDeclarationPdf(
	request: Request,
): Promise<ResolvedDeclarationPdf> {
	const { siren } = await getSessionSiren(request);
	if (!siren) {
		return { error: pdfErrorResponse("Non autorisé", 401) };
	}

	const requestedYear = readRequestedYear(request);
	if (requestedYear.invalid) {
		return { error: invalidYearResponse() };
	}
	const year = requestedYear.year ?? getCurrentYear();
	const declarationType = readDeclarationType(request);

	const data = await buildPdfData(siren, year, new Date(), declarationType);
	const filenamePrefix =
		declarationType === "correction"
			? "seconde-declaration"
			: "declaration-remuneration";

	return { data, filename: `${filenamePrefix}-${siren}-${year}.pdf` };
}

export const GET = withAuditedRoute(
	{
		action: AUDIT_ACTIONS.PDF_DECLARATION_DOWNLOAD,
		resolveContext: resolveAuditContext,
	},
	async (request) => {
		try {
			const resolved = await resolveDeclarationPdf(request);
			if (resolved.error) return resolved.error;

			const body = await renderPdfAndCacheSize(ROUTE, resolved.data, () =>
				renderToBuffer(DeclarationPdfDocument({ data: resolved.data })),
			);

			return new Response(body, {
				headers: pdfHeaders(resolved.filename, body.byteLength),
			});
		} catch (error) {
			console.error("[declaration-pdf]", error);
			return pdfErrorResponse("Impossible de générer le PDF", 400);
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
			const resolved = await resolveDeclarationPdf(request);
			if (resolved.error) {
				return pdfErrorResponse(null, resolved.error.status);
			}

			const size = await resolvePdfSize(ROUTE, resolved.data, () =>
				renderToBuffer(DeclarationPdfDocument({ data: resolved.data })),
			);

			return new Response(null, {
				headers: pdfHeaders(resolved.filename, size),
			});
		} catch (error) {
			console.error("[declaration-pdf:head]", error);
			return pdfErrorResponse(null, 400);
		}
	},
);
