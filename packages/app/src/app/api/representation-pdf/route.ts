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

export const GET = withAuditedRoute(
	{
		action: AUDIT_ACTIONS.PDF_REPRESENTATION_DOWNLOAD,
		resolveContext: async (request) => {
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
		},
	},
	async (request) => {
		const { siren } = await getSessionSiren(request);
		if (!siren) {
			return new Response("Non autorisé", { status: 401 });
		}

		const url = new URL(request.url);
		const yearParam = url.searchParams.get("year");
		const parsedYear = yearParam ? Number.parseInt(yearParam, 10) : Number.NaN;
		const year = Number.isInteger(parsedYear)
			? parsedYear
			: getReferenceYearFor(getCurrentYear());

		try {
			const data = await buildRepresentationPdfData(siren, year, new Date());
			const buffer = await renderToBuffer(RepresentationPdfDocument({ data }));
			const filename = `representation-equilibree-${siren}-${data.campaignYear}.pdf`;

			return new Response(new Uint8Array(buffer), {
				headers: {
					"Content-Type": "application/pdf",
					"Content-Disposition": `attachment; filename="${filename}"`,
				},
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
