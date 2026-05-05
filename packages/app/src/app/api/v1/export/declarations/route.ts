import { AUDIT_ACTIONS } from "~/modules/audit";
import {
	assembleDeclaration,
	exportDeclarationsQuerySchema,
	fetchCseFilesByDeclaration,
	fetchCseOpinionsByDeclaration,
	fetchIndicatorGByDeclaration,
	fetchJointEvaluationFilesByDeclaration,
	fetchSubmittedDeclarations,
} from "~/modules/export";
import { withAuditedRoute } from "~/server/audit/withAuditedRoute";
import { assertGatewaySource } from "~/server/services/gatewaySource";

/**
 * GET /api/v1/export/declarations?date_begin=YYYY-MM-DD&date_end=YYYY-MM-DD
 *
 * Secured REST API returning submitted declarations as JSON.
 *
 * Authentication is handled at the edge by the APISIX gateway
 * (`key-auth` + `limit-req` plugins, see
 * `.kontinuous/templates/apisix-suit.configmap.yaml`). The handler only
 * enforces that the request actually transited through APISIX via the
 * `X-Gateway-Forwarded` header (see `assertGatewaySource`).
 *
 * - date_begin (required): start date (inclusive), filters on submission date (updatedAt, UTC)
 * - date_end (optional): end date (exclusive). If omitted, returns only date_begin day.
 */
export const GET = withAuditedRoute(
	{
		action: AUDIT_ACTIONS.EXPORT_API_DECLARATIONS,
		resolveContext: (request) => {
			const url = new URL(request.url);
			return {
				metadata: {
					date_begin: url.searchParams.get("date_begin") ?? null,
					date_end: url.searchParams.get("date_end") ?? null,
				},
			};
		},
	},
	apiExportDeclarationsHandler,
);

async function apiExportDeclarationsHandler(
	request: Request,
): Promise<Response> {
	const gatewayError = assertGatewaySource(request);
	if (gatewayError) return gatewayError;

	try {
		const url = new URL(request.url);
		const parsed = exportDeclarationsQuerySchema.safeParse({
			date_begin: url.searchParams.get("date_begin") ?? undefined,
			date_end: url.searchParams.get("date_end") ?? undefined,
		});

		if (!parsed.success) {
			return Response.json(
				{
					error:
						"Paramètres invalides. 'date_begin' est requis, format YYYY-MM-DD.",
					details: parsed.error.issues,
				},
				{ status: 400 },
			);
		}

		const { date_begin } = parsed.data;
		const dateEnd = parsed.data.date_end ?? getNextDate(date_begin);

		const rows = await fetchSubmittedDeclarations(date_begin, dateEnd);

		const declarationIds = rows.map((r) => r.declarationId);
		const sirenYearKeys = rows.map((r) => ({
			siren: r.siren,
			year: r.year,
		}));

		const [indicatorGMap, cseMap, cseFilesMap, jointEvalFilesMap] =
			await Promise.all([
				fetchIndicatorGByDeclaration(declarationIds),
				fetchCseOpinionsByDeclaration(declarationIds),
				fetchCseFilesByDeclaration(sirenYearKeys),
				fetchJointEvaluationFilesByDeclaration(sirenYearKeys),
			]);

		const data = rows.map((row) => {
			const key = `${row.siren}-${row.year}`;
			return assembleDeclaration(
				row,
				indicatorGMap.get(row.declarationId) ?? [],
				cseMap.get(row.declarationId) ?? [],
				cseFilesMap.get(key) ?? [],
				jointEvalFilesMap.get(key) ?? [],
			);
		});

		return Response.json({
			Date_debut: date_begin,
			Date_fin: dateEnd,
			Nombre: data.length,
			Declarations: data,
		});
	} catch (error) {
		// Only log the message: AWS SDK / pg errors sometimes attach the request
		// payload (presigned URLs, DB credentials) in `.cause`, which would leak
		// to the log shipper if we printed the raw object.
		console.error(
			"[api/v1/export/declarations]",
			error instanceof Error ? error.message : "unknown error",
		);
		return Response.json(
			{ error: "Erreur lors de la récupération des déclarations" },
			{ status: 500 },
		);
	}
}

function getNextDate(date: string): string {
	const d = new Date(`${date}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() + 1);
	return d.toISOString().slice(0, 10);
}
