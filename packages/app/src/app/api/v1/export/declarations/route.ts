import {
	assembleDeclaration,
	fetchCseOpinionsByDeclaration,
	fetchIndicatorGByDeclaration,
	fetchSubmittedDeclarations,
} from "~/modules/export/fetchDeclarations";
import { exportDeclarationsQuerySchema } from "~/modules/export/schemas";
import { verifySuitApiKey } from "~/server/services/suitApiAuth";

/**
 * GET /api/v1/export/declarations?date_begin=YYYY-MM-DD&date_end=YYYY-MM-DD
 *
 * Secured REST API returning submitted declarations as JSON.
 * Requires a valid SUIT API key in the Authorization: Bearer header.
 * - date_begin (required): start date (inclusive), filters on submission date (updatedAt, UTC)
 * - date_end (optional): end date (exclusive). If omitted, returns only date_begin day.
 */
export async function GET(request: Request) {
	const authResult = verifySuitApiKey(request);
	if (authResult !== true) return authResult;

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

		const sirenYearKeys = rows.map((r) => ({ siren: r.siren, year: r.year }));
		const declarationIds = rows.map((r) => r.declarationId);

		const [indicatorGMap, cseMap] = await Promise.all([
			fetchIndicatorGByDeclaration(declarationIds),
			fetchCseOpinionsByDeclaration(declarationIds),
		]);

		const data = rows.map((row) => {
			const key = `${row.siren}-${row.year}`;
			return assembleDeclaration(
				row,
				indicatorGMap.get(row.declarationId) ?? [],
				cseMap.get(row.declarationId) ?? [],
			);
		});

		return Response.json({
			dateBegin: date_begin,
			dateEnd: dateEnd,
			count: data.length,
			declarations: data,
		});
	} catch (error) {
		console.error("[api/v1/export/declarations]", error);
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
