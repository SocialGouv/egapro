import { renderToBuffer } from "@react-pdf/renderer";
import { and, eq } from "drizzle-orm";

import { AUDIT_ACTIONS } from "~/modules/audit";
import {
	type PrefillPdfData,
	PrefillPdfDocument,
} from "~/modules/declarationPdf/PrefillPdfDocument";
import { extractSiren, getCurrentYear } from "~/modules/domain";
import { cachedAuth } from "~/server/audit/cachedAuth";
import { withAuditedRoute } from "~/server/audit/withAuditedRoute";
import { db } from "~/server/db";
import { companies, gipMdsData } from "~/server/db/schema";
import {
	pdfHeaders,
	renderPdfAndCacheSize,
	resolvePdfSize,
} from "~/server/pdf/pdfRoute";

const ROUTE = "prefill-pdf";

const resolveAuditContext = async (request: Request) => {
	const session = await cachedAuth(request);
	const url = new URL(request.url);
	return {
		userId: session?.user?.id ?? null,
		userEmail: session?.user?.email ?? null,
		siren: session?.user?.siret ? extractSiren(session.user.siret) : null,
		metadata: { year: url.searchParams.get("year") ?? null },
	};
};

type ResolvedPrefillPdf =
	| { error: Response }
	| { data: PrefillPdfData; filename: string; error?: undefined };

async function resolvePrefillPdf(
	request: Request,
): Promise<ResolvedPrefillPdf> {
	const session = await cachedAuth(request);
	if (!session?.user?.siret) {
		return { error: new Response("Non autorisé", { status: 401 }) };
	}

	const siren = extractSiren(session.user.siret);
	const url = new URL(request.url);
	const yearParam = url.searchParams.get("year");
	const parsedYear = yearParam ? Number.parseInt(yearParam, 10) : null;
	if (
		parsedYear !== null &&
		(Number.isNaN(parsedYear) || parsedYear < 2000 || parsedYear > 2100)
	) {
		return {
			error: new Response("Paramètre 'year' invalide", { status: 400 }),
		};
	}
	const year = parsedYear ?? getCurrentYear();

	const [row] = await db
		.select()
		.from(gipMdsData)
		.where(and(eq(gipMdsData.siren, siren), eq(gipMdsData.year, year)))
		.limit(1);

	if (!row) {
		return { error: new Response("Aucune donnée préremplie", { status: 404 }) };
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

	return { data, filename: `donnees-preremplies-${siren}-${year}.pdf` };
}

export const GET = withAuditedRoute(
	{
		action: AUDIT_ACTIONS.PDF_PREFILL_DOWNLOAD,
		resolveContext: resolveAuditContext,
	},
	async (request) => {
		try {
			const resolved = await resolvePrefillPdf(request);
			if (resolved.error) return resolved.error;

			const body = await renderPdfAndCacheSize(ROUTE, resolved.data, () =>
				renderToBuffer(PrefillPdfDocument({ data: resolved.data })),
			);

			return new Response(body, {
				headers: pdfHeaders(resolved.filename, body.byteLength),
			});
		} catch (error) {
			console.error("[prefill-pdf]", error);
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
			const resolved = await resolvePrefillPdf(request);
			if (resolved.error) {
				return new Response(null, { status: resolved.error.status });
			}

			const size = await resolvePdfSize(ROUTE, resolved.data, () =>
				renderToBuffer(PrefillPdfDocument({ data: resolved.data })),
			);

			return new Response(null, {
				headers: pdfHeaders(resolved.filename, size),
			});
		} catch (error) {
			console.error("[prefill-pdf:head]", error);
			return new Response(null, { status: 500 });
		}
	},
);
