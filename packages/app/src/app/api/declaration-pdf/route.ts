import { renderToBuffer } from "@react-pdf/renderer";
import { AUDIT_ACTIONS } from "~/modules/audit";
import { buildPdfData } from "~/modules/declarationPdf/buildPdfData";
import { DeclarationPdfDocument } from "~/modules/declarationPdf/DeclarationPdfDocument";
import { getCurrentYear } from "~/modules/domain";
import { withAuditedRoute } from "~/server/audit/withAuditedRoute";
import { getSessionSiren } from "~/server/auth/sessionSiren";

export const GET = withAuditedRoute(
	{
		action: AUDIT_ACTIONS.PDF_DECLARATION_DOWNLOAD,
		resolveContext: async (request) => {
			const { session, siren } = await getSessionSiren(request);
			const url = new URL(request.url);
			return {
				userId: session?.user?.id ?? null,
				userEmail: session?.user?.email ?? null,
				siren,
				metadata: {
					year: url.searchParams.get("year") ?? null,
					type: url.searchParams.get("type") ?? "initial",
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
		const year = yearParam ? Number.parseInt(yearParam, 10) : getCurrentYear();
		const declarationType =
			url.searchParams.get("type") === "correction" ? "correction" : "initial";

		try {
			const data = await buildPdfData(siren, year, new Date(), declarationType);
			const buffer = await renderToBuffer(DeclarationPdfDocument({ data }));
			const filenamePrefix =
				declarationType === "correction"
					? "seconde-declaration"
					: "declaration-remuneration";
			const filename = `${filenamePrefix}-${siren}-${year}.pdf`;

			return new Response(new Uint8Array(buffer), {
				headers: {
					"Content-Type": "application/pdf",
					"Content-Disposition": `attachment; filename="${filename}"`,
				},
			});
		} catch (error) {
			console.error("[declaration-pdf]", error);
			return new Response("Impossible de générer le PDF", { status: 400 });
		}
	},
);
