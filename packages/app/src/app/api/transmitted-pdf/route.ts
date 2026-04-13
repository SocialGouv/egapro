import { renderToBuffer } from "@react-pdf/renderer";
import { AUDIT_ACTIONS } from "~/modules/audit";
import { buildTransmittedPdfData } from "~/modules/declarationPdf/buildTransmittedPdfData";
import { TransmittedPdfDocument } from "~/modules/declarationPdf/TransmittedPdfDocument";
import { extractSiren, getCurrentYear } from "~/modules/domain";
import { cachedAuth } from "~/server/audit/cachedAuth";
import { withAuditedRoute } from "~/server/audit/withAuditedRoute";

export const GET = withAuditedRoute(
	{
		action: AUDIT_ACTIONS.PDF_TRANSMITTED_DOWNLOAD,
		resolveContext: async (request) => {
			const session = await cachedAuth(request);
			const url = new URL(request.url);
			return {
				userId: session?.user?.id ?? null,
				userEmail: session?.user?.email ?? null,
				siren: session?.user?.siret ? extractSiren(session.user.siret) : null,
				metadata: { year: url.searchParams.get("year") ?? null },
			};
		},
	},
	async (request) => {
		const session = await cachedAuth(request);
		if (!session?.user?.siret) {
			return new Response("Non autorisé", { status: 401 });
		}

		const siren = extractSiren(session.user.siret);
		const url = new URL(request.url);
		const yearParam = url.searchParams.get("year");
		const year = yearParam ? Number.parseInt(yearParam, 10) : getCurrentYear();

		try {
			const data = await buildTransmittedPdfData(siren, year, new Date());
			const buffer = await renderToBuffer(TransmittedPdfDocument({ data }));
			const filename = `recapitulatif-elements-transmis-${siren}-${data.year + 1}.pdf`;

			return new Response(new Uint8Array(buffer), {
				headers: {
					"Content-Type": "application/pdf",
					"Content-Disposition": `attachment; filename="${filename}"`,
				},
			});
		} catch (error) {
			console.error("[transmitted-pdf]", error);
			return new Response("Impossible de générer le PDF", { status: 500 });
		}
	},
);
