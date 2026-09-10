import { renderToBuffer } from "@react-pdf/renderer";
import { AUDIT_ACTIONS } from "~/modules/audit";
import { buildTransmittedPdfData } from "~/modules/declarationPdf/buildTransmittedPdfData";
import { TransmittedPdfDocument } from "~/modules/declarationPdf/TransmittedPdfDocument";
import { getCurrentYear } from "~/modules/domain";
import { withAuditedRoute } from "~/server/audit/withAuditedRoute";
import { getSessionSiren } from "~/server/auth/sessionSiren";
import {
	pdfHeaders,
	renderPdfAndCacheSize,
	resolvePdfSize,
} from "~/server/pdf/pdfRoute";

const ROUTE = "transmitted-pdf";

const resolveAuditContext = async (request: Request) => {
	const { session, siren } = await getSessionSiren(request);
	const url = new URL(request.url);
	return {
		userId: session?.user?.id ?? null,
		userEmail: session?.user?.email ?? null,
		siren,
		metadata: { year: url.searchParams.get("year") ?? null },
	};
};

type ResolvedTransmittedPdf =
	| { unauthorized: Response }
	| {
			data: Awaited<ReturnType<typeof buildTransmittedPdfData>>;
			filename: string;
			unauthorized?: undefined;
	  };

async function resolveTransmittedPdf(
	request: Request,
): Promise<ResolvedTransmittedPdf> {
	const { siren } = await getSessionSiren(request);
	if (!siren) {
		return { unauthorized: new Response("Non autorisé", { status: 401 }) };
	}

	const url = new URL(request.url);
	const yearParam = url.searchParams.get("year");
	const year = yearParam ? Number.parseInt(yearParam, 10) : getCurrentYear();

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
			if (resolved.unauthorized) return resolved.unauthorized;

			const body = await renderPdfAndCacheSize(ROUTE, resolved.data, () =>
				renderToBuffer(TransmittedPdfDocument({ data: resolved.data })),
			);

			return new Response(body, {
				headers: pdfHeaders(resolved.filename, body.byteLength),
			});
		} catch (error) {
			console.error("[transmitted-pdf]", error);
			return new Response("Impossible de générer le PDF", { status: 500 });
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
			if (resolved.unauthorized) return resolved.unauthorized;

			const size = await resolvePdfSize(ROUTE, resolved.data, () =>
				renderToBuffer(TransmittedPdfDocument({ data: resolved.data })),
			);

			return new Response(null, {
				headers: pdfHeaders(resolved.filename, size),
			});
		} catch (error) {
			console.error("[transmitted-pdf:head]", error);
			return new Response(null, { status: 500 });
		}
	},
);
