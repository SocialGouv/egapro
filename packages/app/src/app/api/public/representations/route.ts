import { NextResponse } from "next/server";

import { AUDIT_ACTIONS } from "~/modules/audit";
import {
	PUBLIC_API_SEARCH_HEADERS,
	parsePublicRepresentationSearchPage,
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
				parsePublicRepresentationSearchPage(new URL(request.url).searchParams),
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

async function publicRepresentationsHandler(
	request: Request,
): Promise<Response> {
	try {
		const limited = await enforcePublicApiRateLimit(request);
		if (limited) return limited;
		const parsed = parsePublicRepresentationSearchPage(
			new URL(request.url).searchParams,
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
