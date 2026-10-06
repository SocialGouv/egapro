import { renderToBuffer } from "@react-pdf/renderer";
import { AUDIT_ACTIONS } from "~/modules/audit";
import { buildPdfData } from "~/modules/declarationPdf/buildPdfData";
import { DeclarationPdfDocument } from "~/modules/declarationPdf/DeclarationPdfDocument";
import { getCurrentYear } from "~/modules/domain";
import { withAuditedRoute } from "~/server/audit/withAuditedRoute";
import { getSessionSiren } from "~/server/auth/sessionSiren";
import {
	invalidYearResponse,
	pdfHeaders,
	readRequestedYear,
	renderPdfAndCacheSize,
	resolvePdfSize,
} from "~/server/pdf/pdfRoute";

const ROUTE = "declaration-pdf";

const resolveAuditContext = async (request: Request) => {
	const { session, siren } = await getSessionSiren(request);
	const url = new URL(request.url);
	const requestedYear = readRequestedYear(request);
	return {
		userId: session?.user?.id ?? null,
		userEmail: session?.user?.email ?? null,
		siren,
		metadata: {
			year: requestedYear.year,
			invalidYear: requestedYear.invalid,
			type: url.searchParams.get("type") ?? "initial",
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
		return { error: new Response("Non autorisé", { status: 401 }) };
	}

	const requestedYear = readRequestedYear(request);
	if (requestedYear.invalid) {
		return { error: invalidYearResponse() };
	}
	const year = requestedYear.year ?? getCurrentYear();
	const url = new URL(request.url);
	const declarationType =
		url.searchParams.get("type") === "correction" ? "correction" : "initial";

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
			return new Response("Impossible de générer le PDF", { status: 400 });
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
				return new Response(null, { status: resolved.error.status });
			}

			const size = await resolvePdfSize(ROUTE, resolved.data, () =>
				renderToBuffer(DeclarationPdfDocument({ data: resolved.data })),
			);

			return new Response(null, {
				headers: pdfHeaders(resolved.filename, size),
			});
		} catch (error) {
			console.error("[declaration-pdf:head]", error);
			return new Response(null, { status: 400 });
		}
	},
);
