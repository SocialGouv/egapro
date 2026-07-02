import { AUDIT_ACTIONS } from "~/modules/audit";
import { parseSiren } from "~/modules/domain";
import { getPublicDeclarationsBySiren } from "~/modules/public-api";
import { logAction } from "~/server/audit/log";
import { buildRequestContext } from "~/server/audit/requestContext";

const PUBLIC_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Cache-Control": "public, max-age=300, s-maxage=300",
};

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ siren: string }> },
) {
	const startedAt = Date.now();
	const requestContext = buildRequestContext(request.headers);
	const { siren: rawSiren } = await params;

	const siren = parseSiren(rawSiren);
	if (!siren) {
		void logAction({
			action: AUDIT_ACTIONS.PUBLIC_DECLARATIONS_BY_SIREN,
			status: "failure",
			siren: null,
			metadata: { rawSiren },
			errorMessage: "HTTP 400",
			ipAddress: requestContext.ipAddress,
			userAgent: requestContext.userAgent,
			durationMs: Date.now() - startedAt,
		});
		return Response.json(
			{ error: "SIREN invalide. Attendu : 9 chiffres." },
			{ status: 400, headers: PUBLIC_HEADERS },
		);
	}

	const url = new URL(request.url);
	const limitParam = url.searchParams.get("limit");
	let limit: number | undefined;
	if (limitParam !== null) {
		const parsed = Number.parseInt(limitParam, 10);
		if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
			return Response.json(
				{ error: "Le paramètre 'limit' doit être un entier entre 1 et 100." },
				{ status: 400, headers: PUBLIC_HEADERS },
			);
		}
		limit = parsed;
	}

	try {
		const data = await getPublicDeclarationsBySiren(siren, limit);

		void logAction({
			action: AUDIT_ACTIONS.PUBLIC_DECLARATIONS_BY_SIREN,
			status: "success",
			siren,
			metadata: { count: data.length, limit: limit ?? null },
			ipAddress: requestContext.ipAddress,
			userAgent: requestContext.userAgent,
			durationMs: Date.now() - startedAt,
		});

		return Response.json(data, { headers: PUBLIC_HEADERS });
	} catch (error) {
		console.error(
			"[api/public/declarations/:siren]",
			error instanceof Error ? error.message : "unknown error",
		);
		void logAction({
			action: AUDIT_ACTIONS.PUBLIC_DECLARATIONS_BY_SIREN,
			status: "failure",
			siren,
			metadata: null,
			errorMessage: error instanceof Error ? error.message : "Unknown error",
			ipAddress: requestContext.ipAddress,
			userAgent: requestContext.userAgent,
			durationMs: Date.now() - startedAt,
		});
		return Response.json(
			{ error: "Erreur lors de la récupération des déclarations." },
			{ status: 500, headers: PUBLIC_HEADERS },
		);
	}
}
