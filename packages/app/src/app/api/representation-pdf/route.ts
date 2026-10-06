import { renderToBuffer } from "@react-pdf/renderer";
import { AUDIT_ACTIONS } from "~/modules/audit";
import {
	buildRepresentationPdfData,
	RepresentationDeclarationNotFoundError,
} from "~/modules/declarationPdf/buildRepresentationPdfData";
import { RepresentationPdfDocument } from "~/modules/declarationPdf/RepresentationPdfDocument";
import { getCurrentYear, getReferenceYearFor } from "~/modules/domain";
import { withAuditedRoute } from "~/server/audit/withAuditedRoute";
import { getSessionSiren } from "~/server/auth/sessionSiren";
import {
	invalidYearResponse,
	pdfHeaders,
	readRequestedYear,
	renderPdfAndCacheSize,
	resolvePdfSize,
} from "~/server/pdf/pdfRoute";

const ROUTE = "representation-pdf";

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
		},
	};
};

type ResolvedRepresentationPdf =
	| { error: Response }
	| {
			data: Awaited<ReturnType<typeof buildRepresentationPdfData>>;
			filename: string;
			error?: undefined;
	  };

async function resolveRepresentationPdf(
	request: Request,
): Promise<ResolvedRepresentationPdf> {
	const { siren } = await getSessionSiren(request);
	if (!siren) {
		return { error: new Response("Non autorisé", { status: 401 }) };
	}

	const requestedYear = readRequestedYear(request);
	if (requestedYear.invalid) {
		return { error: invalidYearResponse() };
	}
	const year = requestedYear.year ?? getReferenceYearFor(getCurrentYear());

	const data = await buildRepresentationPdfData(siren, year, new Date());

	return {
		data,
		filename: `representation-equilibree-${siren}-${data.campaignYear}.pdf`,
	};
}

export const GET = withAuditedRoute(
	{
		action: AUDIT_ACTIONS.PDF_REPRESENTATION_DOWNLOAD,
		resolveContext: resolveAuditContext,
	},
	async (request) => {
		try {
			const resolved = await resolveRepresentationPdf(request);
			if (resolved.error) return resolved.error;

			const body = await renderPdfAndCacheSize(ROUTE, resolved.data, () =>
				renderToBuffer(RepresentationPdfDocument({ data: resolved.data })),
			);

			return new Response(body, {
				headers: pdfHeaders(resolved.filename, body.byteLength),
			});
		} catch (error) {
			if (error instanceof RepresentationDeclarationNotFoundError) {
				return new Response("Déclaration introuvable", { status: 404 });
			}
			console.error("[representation-pdf]", error);
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
			const resolved = await resolveRepresentationPdf(request);
			if (resolved.error) {
				return new Response(null, { status: resolved.error.status });
			}

			const size = await resolvePdfSize(ROUTE, resolved.data, () =>
				renderToBuffer(RepresentationPdfDocument({ data: resolved.data })),
			);

			return new Response(null, {
				headers: pdfHeaders(resolved.filename, size),
			});
		} catch (error) {
			if (error instanceof RepresentationDeclarationNotFoundError) {
				return new Response(null, { status: 404 });
			}
			console.error("[representation-pdf:head]", error);
			return new Response(null, { status: 400 });
		}
	},
);
