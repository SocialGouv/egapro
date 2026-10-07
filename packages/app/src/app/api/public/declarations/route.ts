import { NextResponse } from "next/server";

import { AUDIT_ACTIONS } from "~/modules/audit";
import {
	PUBLIC_API_SEARCH_HEADERS,
	parsePublicSearchPage,
} from "~/modules/public-api";
import {
	auditList,
	auditQueryMetadata,
	auditText,
} from "~/server/audit/queryMetadata";
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
		resolveContext: (request) => ({
			metadata: auditQueryMetadata(
				parsePublicSearchPage(new URL(request.url).searchParams),
				(input) => ({
					q: auditText(input.q),
					region: auditList(input.region),
					departement: auditList(input.departement),
					naf: auditList(input.naf),
					city: auditText(input.city),
					sort: input.sort ?? null,
					year: input.year ?? null,
				}),
			),
		}),
	},
	publicDeclarationsHandler,
);

async function publicDeclarationsHandler(request: Request): Promise<Response> {
	try {
		const limited = await enforcePublicApiRateLimit(request);
		if (limited) return limited;
		const parsed = parsePublicSearchPage(new URL(request.url).searchParams);

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
