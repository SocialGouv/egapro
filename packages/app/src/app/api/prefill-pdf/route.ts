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
import {
	pdfHeaders,
	renderPdfAndCacheSize,
	resolvePdfSize,
} from "~/server/pdf/pdfRoute";

const ROUTE = "prefill-pdf";

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

type ResolvedPrefillPdf =
	| { error: Response }
	| { data: PrefillPdfData; filename: string; error?: undefined };

async function resolvePrefillPdf(
	request: Request,
): Promise<ResolvedPrefillPdf> {
	const { siren } = await getSessionSiren(request);
	if (!siren) {
		return { error: new Response("Non autorisé", { status: 401 }) };
	}

	const requestedYear = readRequestedYear(request);
	if (requestedYear.invalid) {
		return {
			error: new Response("Paramètre 'year' invalide", { status: 400 }),
		};
	}
	const year = requestedYear.year ?? getCurrentYear();

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
