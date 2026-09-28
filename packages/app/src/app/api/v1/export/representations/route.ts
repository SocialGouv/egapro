import { AUDIT_ACTIONS } from "~/modules/audit";
import {
	assembleRepresentation,
	fetchSubmittedRepresentations,
	parseExportDateWindow,
} from "~/modules/export";
import { withAuditedRoute } from "~/server/audit/withAuditedRoute";
import { assertGatewaySource } from "~/server/services/gatewaySource";

/**
 * GET /api/v1/export/representations?date_begin=YYYY-MM-DD&date_end=YYYY-MM-DD
 *
 * Secured REST API returning submitted balanced-representation declarations
 * (art. D. 1142-19) as JSON, in the same envelope format as
 * `/api/v1/export/declarations` — served on a dedicated route, the
 * remuneration declarations endpoint is left untouched.
 *
 * Authentication is handled at the edge by the APISIX gateway
 * (`key-auth` + `limit-req` plugins, see
 * `.kontinuous/templates/apisix-suit.configmap.yaml`). The handler only
 * enforces that the request actually transited through APISIX via the
 * `X-Gateway-Forwarded` header (see `assertGatewaySource`).
 *
 * - date_begin (required): start date (inclusive), filters on submission date (submittedAt, UTC)
 * - date_end (optional): end date (exclusive). If omitted, returns only date_begin day.
 *
 * SUIT is a controlling authority, so identity/location fields are returned
 * in full even for non-diffusible companies (S30) — the public-facing
 * non-diffusion rule only applies to public channels.
 */
export const GET = withAuditedRoute(
	{
		action: AUDIT_ACTIONS.EXPORT_API_REPRESENTATIONS,
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
	apiExportRepresentationsHandler,
);

async function apiExportRepresentationsHandler(
	request: Request,
): Promise<Response> {
	const gatewayError = assertGatewaySource(request);
	if (gatewayError) return gatewayError;

	const dateWindow = parseExportDateWindow(request);
	if (dateWindow instanceof Response) return dateWindow;

	try {
		const { date_begin, dateEnd } = dateWindow;
		const rows = await fetchSubmittedRepresentations(date_begin, dateEnd);
		const data = rows.map(assembleRepresentation);

		return Response.json({
			Date_debut: date_begin,
			Date_fin: dateEnd,
			Nombre: data.length,
			Representations: data,
		});
	} catch (error) {
		// Only log the message: AWS SDK / pg errors sometimes attach the request
		// payload (presigned URLs, DB credentials) in `.cause`, which would leak
		// to the log shipper if we printed the raw object.
		console.error(
			"[api/v1/export/representations]",
			error instanceof Error ? error.message : "unknown error",
		);
		return Response.json(
			{
				error:
					"Erreur lors de la récupération des données de représentation équilibrée",
			},
			{ status: 500 },
		);
	}
}
