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
	pdfHeaders,
	renderPdfAndCacheSize,
	resolvePdfSize,
} from "~/server/pdf/pdfRoute";

const ROUTE = "representation-pdf";

const resolveAuditContext = async (request: Request) => {
	const { session, siren } = await getSessionSiren(request);
	const url = new URL(request.url);
	return {
		userId: session?.user?.id ?? null,
		userEmail: session?.user?.email ?? null,
		siren,
		metadata: {
			year: url.searchParams.get("year") ?? null,
		},
	};
};

type ResolvedRepresentationPdf =
	| { unauthorized: Response }
	| {
			data: Awaited<ReturnType<typeof buildRepresentationPdfData>>;
			filename: string;
			unauthorized?: undefined;
	  };

async function resolveRepresentationPdf(
	request: Request,
): Promise<ResolvedRepresentationPdf> {
	const { siren } = await getSessionSiren(request);
	if (!siren) {
		return { unauthorized: new Response("Non autorisé", { status: 401 }) };
	}

	const url = new URL(request.url);
	const yearParam = url.searchParams.get("year");
	const parsedYear = yearParam ? Number.parseInt(yearParam, 10) : Number.NaN;
	const year = Number.isInteger(parsedYear)
		? parsedYear
		: getReferenceYearFor(getCurrentYear());

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
			if (resolved.unauthorized) return resolved.unauthorized;

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
			if (resolved.unauthorized) return resolved.unauthorized;

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
