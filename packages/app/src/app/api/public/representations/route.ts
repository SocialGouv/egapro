import { NextResponse } from "next/server";

import { AUDIT_ACTIONS } from "~/modules/audit";
import {
	PUBLIC_API_SEARCH_HEADERS,
	publicRepresentationSearchInputSchema,
	searchPublicRepresentations,
} from "~/modules/public-api";
import {
	auditList,
	auditQueryMetadata,
	auditText,
} from "~/server/audit/queryMetadata";
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
		resolveContext: (request) => ({
			metadata: auditQueryMetadata(
				publicRepresentationSearchInputSchema.safeParse(
					readSearchInput(new URL(request.url).searchParams),
				),
				(input) => ({
					q: auditText(input.q),
					region: auditList(input.region),
					departement: auditList(input.departement),
					naf: auditList(input.naf),
					year: input.year ?? null,
				}),
			),
		}),
	},
	publicRepresentationsHandler,
);

function readSearchInput(sp: URLSearchParams) {
	const rawYear = sp.get("year");
	const rawLimit = sp.get("limit");
	const rawOffset = sp.get("offset");
	// Facets are repeatable (`?region=A&region=B`); getAll also returns the
	// single-value form the documented API has always accepted.
	return {
		q: sp.get("q") ?? undefined,
		region: sp.getAll("region"),
		departement: sp.getAll("departement"),
		naf: sp.getAll("naf"),
		year: rawYear ? Number(rawYear) : undefined,
		limit: rawLimit ? Number(rawLimit) : undefined,
		offset: rawOffset ? Number(rawOffset) : undefined,
	};
}

async function publicRepresentationsHandler(
	request: Request,
): Promise<Response> {
	try {
		const limited = await enforcePublicApiRateLimit(request);
		if (limited) return limited;
		const parsed = publicRepresentationSearchInputSchema.safeParse(
			readSearchInput(new URL(request.url).searchParams),
		);

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
