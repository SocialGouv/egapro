import { AUDIT_ACTIONS } from "~/modules/audit";
import { parseSiren } from "~/modules/domain";
import {
	buildCseFilePayload,
	buildJointEvaluationFilePayload,
	exportFilesQuerySchema,
	fetchCseFilesByDeclaration,
	fetchJointEvaluationFilesByDeclaration,
} from "~/modules/export";
import { withAuditedRoute } from "~/server/audit/withAuditedRoute";
import { assertGatewaySource } from "~/server/services/gatewaySource";

/**
 * GET /api/v1/files?siren=123456789&year=2027
 *
 * Secured REST API returning file metadata for CSE opinions and joint
 * evaluations. Authentication is handled at the edge by the APISIX
 * gateway; the handler only enforces that the request transited through
 * APISIX via the `X-Gateway-Forwarded` header.
 */
export const GET = withAuditedRoute(
	{
		action: AUDIT_ACTIONS.EXPORT_API_FILES,
		resolveContext: (request) => {
			const url = new URL(request.url);
			// Validate siren before storing it: the audit `siren` column is
			// `varchar(9)` and must contain a real SIREN, not arbitrary input.
			const siren = parseSiren(url.searchParams.get("siren"));
			return {
				siren,
				metadata: {
					siren,
					year: url.searchParams.get("year") ?? null,
				},
			};
		},
	},
	apiFilesHandler,
);

async function apiFilesHandler(request: Request): Promise<Response> {
	const gatewayError = assertGatewaySource(request);
	if (gatewayError) return gatewayError;

	try {
		const url = new URL(request.url);
		const parsed = exportFilesQuerySchema.safeParse({
			siren: url.searchParams.get("siren") ?? undefined,
			year: url.searchParams.get("year") ?? undefined,
		});

		if (!parsed.success) {
			return Response.json(
				{
					error:
						"Paramètres invalides. 'siren' (9 chiffres) et 'year' (YYYY) sont requis.",
					details: parsed.error.issues,
				},
				{ status: 400 },
			);
		}

		const { siren, year } = parsed.data;

		const [cseFilesMap, jointFilesMap] = await Promise.all([
			fetchCseFilesByDeclaration([{ siren, year }]),
			fetchJointEvaluationFilesByDeclaration([{ siren, year }]),
		]);

		const mapKey = `${siren}-${year}`;
		const cseFiles = (cseFilesMap.get(mapKey) ?? []).map(buildCseFilePayload);
		const jointFiles = (jointFilesMap.get(mapKey) ?? []).map(
			buildJointEvaluationFilePayload,
		);

		return Response.json({
			siren,
			year,
			files: [...cseFiles, ...jointFiles],
		});
	} catch (error) {
		console.error(
			"[api/v1/files]",
			error instanceof Error ? error.message : "unknown error",
		);
		return Response.json(
			{ error: "Erreur lors de la récupération des fichiers" },
			{ status: 500 },
		);
	}
}
