import { renderToBuffer } from "@react-pdf/renderer";
import { and, eq } from "drizzle-orm";

import { AUDIT_ACTIONS } from "~/modules/audit";
import {
	type PrefillPdfData,
	PrefillPdfDocument,
} from "~/modules/declarationPdf/PrefillPdfDocument";
import { getCurrentYear } from "~/modules/domain";
import { withAuditedRoute } from "~/server/audit/withAuditedRoute";
import { getSessionSiren } from "~/server/auth/sessionSiren";
import { db } from "~/server/db";
import { companies, gipMdsData } from "~/server/db/schema";

export const GET = withAuditedRoute(
	{
		action: AUDIT_ACTIONS.PDF_PREFILL_DOWNLOAD,
		resolveContext: async (request) => {
			const { session, siren } = await getSessionSiren(request);
			const url = new URL(request.url);
			return {
				userId: session?.user?.id ?? null,
				userEmail: session?.user?.email ?? null,
				siren,
				metadata: { year: url.searchParams.get("year") ?? null },
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
		const parsedYear = yearParam ? Number.parseInt(yearParam, 10) : null;
		if (
			parsedYear !== null &&
			(Number.isNaN(parsedYear) || parsedYear < 2000 || parsedYear > 2100)
		) {
			return new Response("Paramètre 'year' invalide", { status: 400 });
		}
		const year = parsedYear ?? getCurrentYear();

		try {
			const [row] = await db
				.select()
				.from(gipMdsData)
				.where(and(eq(gipMdsData.siren, siren), eq(gipMdsData.year, year)))
				.limit(1);

			if (!row) {
				return new Response("Aucune donnée préremplie", { status: 404 });
			}

			const [company] = await db
				.select({ name: companies.name })
				.from(companies)
				.where(eq(companies.siren, siren))
				.limit(1);

			const data: PrefillPdfData = {
				siren,
				companyName: company?.name ?? `Entreprise ${siren}`,
				year,
				periodStart: row.periodStart,
				periodEnd: row.periodEnd,
				row: row as unknown as Record<string, string | number | null>,
			};

			const buffer = await renderToBuffer(PrefillPdfDocument({ data }));
			const filename = `donnees-preremplies-${siren}-${year}.pdf`;

			return new Response(new Uint8Array(buffer), {
				headers: {
					"Content-Type": "application/pdf",
					"Content-Disposition": `attachment; filename="${filename}"`,
				},
			});
		} catch (error) {
			console.error("[prefill-pdf]", error);
			return new Response("Impossible de générer le PDF", { status: 500 });
		}
	},
);
