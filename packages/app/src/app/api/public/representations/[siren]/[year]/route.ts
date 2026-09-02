import { AUDIT_ACTIONS } from "~/modules/audit";
import { parseSiren } from "~/modules/domain";
import {
	getPublicRepresentationBySirenYear,
	PUBLIC_API_RESOURCE_HEADERS,
} from "~/modules/public-api";
import { logAction } from "~/server/audit/log";
import { buildRequestContext } from "~/server/audit/requestContext";
import { enforcePublicApiRateLimit } from "~/server/services/publicApiRateLimit";

export function OPTIONS(): Response {
	return new Response(null, {
		status: 204,
		headers: PUBLIC_API_RESOURCE_HEADERS,
	});
}

const MIN_YEAR = 2000;
const MAX_YEAR = 2100;

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ siren: string; year: string }> },
) {
	const limited = await enforcePublicApiRateLimit(request);
	if (limited) return limited;
	const startedAt = Date.now();
	const requestContext = buildRequestContext(request.headers);
	const { siren: rawSiren, year: rawYear } = await params;

	const siren = parseSiren(rawSiren);
	if (!siren) {
		void logAction({
			action: AUDIT_ACTIONS.PUBLIC_REPRESENTATIONS_BY_SIREN_YEAR,
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
			{ status: 400, headers: PUBLIC_API_RESOURCE_HEADERS },
		);
	}

	const year = Number(rawYear);
	if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
		void logAction({
			action: AUDIT_ACTIONS.PUBLIC_REPRESENTATIONS_BY_SIREN_YEAR,
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
			{ status: 400, headers: PUBLIC_API_RESOURCE_HEADERS },
		);
	}

	try {
		const data = await getPublicRepresentationBySirenYear(siren, year);

		if (data === null) {
			void logAction({
				action: AUDIT_ACTIONS.PUBLIC_REPRESENTATIONS_BY_SIREN_YEAR,
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
				{ status: 404, headers: PUBLIC_API_RESOURCE_HEADERS },
			);
		}

		void logAction({
			action: AUDIT_ACTIONS.PUBLIC_REPRESENTATIONS_BY_SIREN_YEAR,
			status: "success",
			siren,
			metadata: { year },
			ipAddress: requestContext.ipAddress,
			userAgent: requestContext.userAgent,
			durationMs: Date.now() - startedAt,
		});

		return Response.json(data, { headers: PUBLIC_API_RESOURCE_HEADERS });
	} catch (error) {
		console.error(
			"[api/public/representations/:siren/:year]",
			error instanceof Error ? error.message : "unknown error",
		);
		void logAction({
			action: AUDIT_ACTIONS.PUBLIC_REPRESENTATIONS_BY_SIREN_YEAR,
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
			{ status: 500, headers: PUBLIC_API_RESOURCE_HEADERS },
		);
	}
}
