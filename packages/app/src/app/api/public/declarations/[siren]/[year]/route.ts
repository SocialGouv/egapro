import { AUDIT_ACTIONS } from "~/modules/audit";
import { FIRST_DECLARATION_YEAR, parseSiren } from "~/modules/domain";
import { getPublicDeclarationBySirenYear } from "~/modules/public-api";
import { logAction } from "~/server/audit/log";
import { buildRequestContext } from "~/server/audit/requestContext";

const PUBLIC_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Cache-Control": "public, max-age=300, s-maxage=300",
};

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ siren: string; year: string }> },
) {
	const startedAt = Date.now();
	const requestContext = buildRequestContext(request.headers);
	const { siren: rawSiren, year: rawYear } = await params;

	const siren = parseSiren(rawSiren);
	if (!siren) {
		void logAction({
			action: AUDIT_ACTIONS.PUBLIC_DECLARATIONS_BY_SIREN_YEAR,
			status: "failure",
			siren: null,
			metadata: { rawSiren, rawYear },
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

	const year = Number.parseInt(rawYear, 10);
	if (!Number.isInteger(year) || year < FIRST_DECLARATION_YEAR || year > 2100) {
		void logAction({
			action: AUDIT_ACTIONS.PUBLIC_DECLARATIONS_BY_SIREN_YEAR,
			status: "failure",
			siren,
			metadata: { rawYear },
			errorMessage: "HTTP 400",
			ipAddress: requestContext.ipAddress,
			userAgent: requestContext.userAgent,
			durationMs: Date.now() - startedAt,
		});
		return Response.json(
			{ error: "Année invalide." },
			{ status: 400, headers: PUBLIC_HEADERS },
		);
	}

	try {
		const data = await getPublicDeclarationBySirenYear(siren, year);

		if (data === null) {
			void logAction({
				action: AUDIT_ACTIONS.PUBLIC_DECLARATIONS_BY_SIREN_YEAR,
				status: "failure",
				siren,
				metadata: { year },
				errorMessage: "HTTP 404",
				ipAddress: requestContext.ipAddress,
				userAgent: requestContext.userAgent,
				durationMs: Date.now() - startedAt,
			});
			return Response.json(
				{ error: "Déclaration non trouvée ou non encore publiée." },
				{ status: 404, headers: PUBLIC_HEADERS },
			);
		}

		void logAction({
			action: AUDIT_ACTIONS.PUBLIC_DECLARATIONS_BY_SIREN_YEAR,
			status: "success",
			siren,
			metadata: { year },
			ipAddress: requestContext.ipAddress,
			userAgent: requestContext.userAgent,
			durationMs: Date.now() - startedAt,
		});

		return Response.json(data, { headers: PUBLIC_HEADERS });
	} catch (error) {
		console.error(
			"[api/public/declarations/:siren/:year]",
			error instanceof Error ? error.message : "unknown error",
		);
		void logAction({
			action: AUDIT_ACTIONS.PUBLIC_DECLARATIONS_BY_SIREN_YEAR,
			status: "failure",
			siren,
			metadata: { year },
			errorMessage: error instanceof Error ? error.message : "Unknown error",
			ipAddress: requestContext.ipAddress,
			userAgent: requestContext.userAgent,
			durationMs: Date.now() - startedAt,
		});
		return Response.json(
			{ error: "Erreur lors de la récupération de la déclaration." },
			{ status: 500, headers: PUBLIC_HEADERS },
		);
	}
}
