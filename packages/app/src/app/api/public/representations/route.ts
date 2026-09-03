import { NextResponse } from "next/server";

import { AUDIT_ACTIONS } from "~/modules/audit";
import {
	PUBLIC_API_SEARCH_HEADERS,
	publicRepresentationSearchInputSchema,
	searchPublicRepresentations,
} from "~/modules/public-api";
import { withAuditedRoute } from "~/server/audit/withAuditedRoute";
import { enforcePublicApiRateLimit } from "~/server/services/publicApiRateLimit";

export async function OPTIONS(): Promise<Response> {
	return new Response(null, {
		status: 204,
		headers: PUBLIC_API_SEARCH_HEADERS,
	});
}

export const GET = withAuditedRoute(
	{
		action: AUDIT_ACTIONS.PUBLIC_REPRESENTATIONS_SEARCH,
		resolveContext: (request) => {
			const url = new URL(request.url);
			const q = url.searchParams.get("q");
			return {
				metadata: {
					q: q ? q.slice(0, 200) : null,
					region: url.searchParams.getAll("region"),
					departement: url.searchParams.getAll("departement"),
					naf: url.searchParams.getAll("naf"),
					year: url.searchParams.get("year") ?? null,
				},
			};
		},
	},
	publicRepresentationsHandler,
);

async function publicRepresentationsHandler(
	request: Request,
): Promise<Response> {
	try {
		const limited = await enforcePublicApiRateLimit(request);
		if (limited) return limited;
		const url = new URL(request.url);
		const sp = url.searchParams;

		const rawYear = sp.get("year");
		const rawLimit = sp.get("limit");
		const rawOffset = sp.get("offset");
		// Facets are repeatable (`?region=A&region=B`); getAll also returns the
		// single-value form the documented API has always accepted.
		const rawInput = {
			q: sp.get("q") ?? undefined,
			region: sp.getAll("region"),
			departement: sp.getAll("departement"),
			naf: sp.getAll("naf"),
			year: rawYear ? Number(rawYear) : undefined,
			limit: rawLimit ? Number(rawLimit) : undefined,
			offset: rawOffset ? Number(rawOffset) : undefined,
		};

		const parsed = publicRepresentationSearchInputSchema.safeParse(rawInput);

		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Paramètres invalides.", details: parsed.error.issues },
				{ status: 400, headers: PUBLIC_API_SEARCH_HEADERS },
			);
		}

		const result = await searchPublicRepresentations(parsed.data);

		return NextResponse.json(result, { headers: PUBLIC_API_SEARCH_HEADERS });
	} catch (error) {
		console.error(
			"[api/public/representations]",
			error instanceof Error ? error.message : "unknown error",
		);
		return NextResponse.json(
			{ error: "Erreur lors de la récupération des déclarations." },
			{ status: 500, headers: PUBLIC_API_SEARCH_HEADERS },
		);
	}
}
