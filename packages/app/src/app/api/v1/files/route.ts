import {
	exportFilesQuerySchema,
	fetchCseFilesByDeclaration,
	fetchJointEvaluationFilesByDeclaration,
} from "~/modules/export";

/**
 * GET /api/v1/files?siren=123456789&year=2027
 *
 * Returns metadata for CSE opinion files and joint evaluation files
 * uploaded for a given company (siren) and year.
 */
export async function GET(request: Request) {
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
		const cseFiles = (cseFilesMap.get(mapKey) ?? []).map((f) => ({
			id: f.id,
			type: "cse_opinion" as const,
			fileName: f.fileName,
			uploadedAt: f.uploadedAt.toISOString(),
		}));
		const jointFiles = (jointFilesMap.get(mapKey) ?? []).map((f) => ({
			id: f.id,
			type: "joint_evaluation" as const,
			fileName: f.fileName,
			uploadedAt: f.uploadedAt.toISOString(),
		}));

		return Response.json({
			siren,
			year,
			files: [...cseFiles, ...jointFiles],
		});
	} catch (error) {
		console.error("[api/v1/files]", error);
		return Response.json(
			{ error: "Erreur lors de la récupération des fichiers" },
			{ status: 500 },
		);
	}
}
