import { NextResponse } from "next/server";

import { AUDIT_ACTIONS } from "~/modules/audit";
import {
	PUBLIC_API_SEARCH_HEADERS,
	publicSearchInputSchema,
} from "~/modules/public-api";
import { withAuditedRoute } from "~/server/audit/withAuditedRoute";
import { enforcePublicApiRateLimit } from "~/server/services/publicApiRateLimit";
import { searchPublicDeclarations } from "~/server/services/publicDeclarationsService";

export async function OPTIONS(): Promise<Response> {
	return new Response(null, {
		status: 204,
		headers: PUBLIC_API_SEARCH_HEADERS,
	});
}

export const GET = withAuditedRoute(
	{
		action: AUDIT_ACTIONS.PUBLIC_DECLARATIONS_SEARCH,
		resolveContext: (request) => {
			const url = new URL(request.url);
			const q = url.searchParams.get("q");
			return {
				metadata: {
					q: q ? q.slice(0, 200) : null,
					region: url.searchParams.getAll("region"),
					departement: url.searchParams.getAll("departement"),
					naf: url.searchParams.getAll("naf"),
					city: url.searchParams.get("city") ?? null,
					sort: url.searchParams.get("sort") ?? null,
					year: url.searchParams.get("year") ?? null,
				},
			};
		},
	},
	publicDeclarationsHandler,
);

async function publicDeclarationsHandler(request: Request): Promise<Response> {
	try {
		const limited = await enforcePublicApiRateLimit(request);
		if (limited) return limited;
		const url = new URL(request.url);
		const sp = url.searchParams;

		const rawYear = sp.get("year");
		const rawLimit = sp.get("limit");
		const rawOffset = sp.get("offset");
		const rawWorkforceMin = sp.get("workforceMin");
		const rawWorkforceMax = sp.get("workforceMax");
		// Facets are repeatable (`?region=A&region=B`); getAll also returns the
		// single-value form the documented API has always accepted.
		const rawInput = {
			q: sp.get("q") ?? undefined,
			city: sp.get("city") ?? undefined,
			region: sp.getAll("region"),
			departement: sp.getAll("departement"),
			naf: sp.getAll("naf"),
			workforceRanges: sp.getAll("workforceRanges"),
			workforceMin: rawWorkforceMin ? Number(rawWorkforceMin) : undefined,
			workforceMax: rawWorkforceMax ? Number(rawWorkforceMax) : undefined,
			year: rawYear ? Number(rawYear) : undefined,
			sort: sp.get("sort") ?? undefined,
			limit: rawLimit ? Number(rawLimit) : undefined,
			offset: rawOffset ? Number(rawOffset) : undefined,
		};

		const parsed = publicSearchInputSchema.safeParse(rawInput);

		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Paramètres invalides.", details: parsed.error.issues },
				{ status: 400, headers: PUBLIC_API_SEARCH_HEADERS },
			);
		}

		const result = await searchPublicDeclarations(parsed.data);

		return NextResponse.json(result, { headers: PUBLIC_API_SEARCH_HEADERS });
	} catch (error) {
		console.error(
			"[api/public/declarations]",
			error instanceof Error ? error.message : "unknown error",
		);
		return NextResponse.json(
			{ error: "Erreur lors de la récupération des déclarations." },
			{ status: 500, headers: PUBLIC_API_SEARCH_HEADERS },
		);
	}
}
