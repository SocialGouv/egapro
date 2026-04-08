import { renderToBuffer } from "@react-pdf/renderer";
import { and, eq } from "drizzle-orm";

import {
	type PrefillPdfData,
	PrefillPdfDocument,
} from "~/modules/declarationPdf/PrefillPdfDocument";
import { extractSiren, getCurrentYear } from "~/modules/domain";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { companies, gipMdsData } from "~/server/db/schema";

export async function GET(request: Request) {
	const session = await auth();
	if (!session?.user?.siret) {
		return new Response("Non autorisé", { status: 401 });
	}

	const siren = extractSiren(session.user.siret);
	const url = new URL(request.url);
	const yearParam = url.searchParams.get("year");
	const year = yearParam ? Number.parseInt(yearParam, 10) : getCurrentYear();

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
		return new Response("Impossible de générer le PDF", { status: 400 });
	}
}
