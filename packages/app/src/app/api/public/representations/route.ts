import { NextResponse } from "next/server";

import { AUDIT_ACTIONS } from "~/modules/audit";
import {
	publicRepresentationSearchInputSchema,
	searchPublicRepresentations,
} from "~/modules/public-api";
import { withAuditedRoute } from "~/server/audit/withAuditedRoute";
import { enforcePublicApiRateLimit } from "~/server/services/publicApiRateLimit";

const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization",
	"Cache-Control": "public, max-age=300, stale-while-revalidate=60",
};

export async function OPTIONS(): Promise<Response> {
	return new Response(null, { status: 204, headers: CORS_HEADERS });
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
					region: url.searchParams.get("region") ?? null,
					departement: url.searchParams.get("departement") ?? null,
					naf: url.searchParams.get("naf") ?? null,
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
		const rawInput = {
			q: sp.get("q") ?? undefined,
			region: sp.get("region") ?? undefined,
			departement: sp.get("departement") ?? undefined,
			naf: sp.get("naf") ?? undefined,
			year: rawYear ? Number(rawYear) : undefined,
			limit: rawLimit ? Number(rawLimit) : undefined,
			offset: rawOffset ? Number(rawOffset) : undefined,
		};

		const parsed = publicRepresentationSearchInputSchema.safeParse(rawInput);

		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Paramètres invalides.", details: parsed.error.issues },
				{ status: 400, headers: CORS_HEADERS },
			);
		}

		const result = await searchPublicRepresentations(parsed.data);

		return NextResponse.json(result, { headers: CORS_HEADERS });
	} catch (error) {
		console.error(
			"[api/public/representations]",
			error instanceof Error ? error.message : "unknown error",
		);
		return NextResponse.json(
			{ error: "Erreur lors de la récupération des déclarations." },
			{ status: 500, headers: CORS_HEADERS },
		);
	}
}
