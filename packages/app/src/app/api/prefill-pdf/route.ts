import { renderToBuffer } from "@react-pdf/renderer";
import { and, eq } from "drizzle-orm";

import { AUDIT_ACTIONS } from "~/modules/audit";
import {
	type PrefillPdfData,
	PrefillPdfDocument,
} from "~/modules/declarationPdf/PrefillPdfDocument";
import { getCurrentYear, parseCampaignYear } from "~/modules/domain";
import { withAuditedRoute } from "~/server/audit/withAuditedRoute";
import { getSessionSiren } from "~/server/auth/sessionSiren";
import { db } from "~/server/db";
import { companies, gipMdsData } from "~/server/db/schema";

/**
 * Reads the `year` query parameter as a number the audit row can carry. The raw
 * string never leaves this function: an unbounded caller-supplied value written
 * to `audit.action_log` would let anyone inflate the trace, and the row is
 * written for refused requests too.
 */
function readRequestedYear(request: Request): {
	year: number | null;
	invalid: boolean;
} {
	const raw = new URL(request.url).searchParams.get("year");
	if (!raw) {
		return { year: null, invalid: false };
	}
	const year = parseCampaignYear(raw);
	return { year, invalid: year === null };
}

export const GET = withAuditedRoute(
	{
		action: AUDIT_ACTIONS.PDF_PREFILL_DOWNLOAD,
		resolveContext: async (request) => {
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
		},
	},
	async (request) => {
		const { siren } = await getSessionSiren(request);
		if (!siren) {
			return new Response("Non autorisé", { status: 401 });
		}

		const requestedYear = readRequestedYear(request);
		if (requestedYear.invalid) {
			return new Response("Paramètre 'year' invalide", { status: 400 });
		}
		const year = requestedYear.year ?? getCurrentYear();

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
