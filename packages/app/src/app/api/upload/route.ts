import { auth } from "~/server/auth";
import { handleStreamingUpload } from "~/server/services/fileUpload";

/**
 * Extracts the authenticated user's SIREN from the session.
 * Returns null if the user is not authenticated or has no SIRET.
 */
async function getAuthenticatedSiren() {
	const session = await auth();
	if (!session?.user) return null;
	const siret = session.user.siret;
	if (!siret) return null;
	return siret.slice(0, 9);
}

export async function POST(request: Request) {
	const siren = await getAuthenticatedSiren();
	if (!siren) {
		return Response.json({ error: "Non authentifié" }, { status: 401 });
	}

	const fileName = request.headers.get("x-filename");
	if (!fileName) {
		return Response.json(
			{ error: "En-tête X-Filename manquant" },
			{ status: 400 },
		);
	}

	if (!request.body) {
		return Response.json(
			{ error: "Corps de la requête vide" },
			{ status: 400 },
		);
	}

	const year = new Date().getFullYear();
	const contentType =
		request.headers.get("content-type") ?? "application/octet-stream";

	try {
		const result = await handleStreamingUpload(request.body, {
			siren,
			year,
			fileName,
			contentType,
		});

		if (!result.ok) {
			const status = result.virus ? 422 : 400;
			return Response.json(
				{ error: result.error, virus: result.virus },
				{ status },
			);
		}

		return Response.json({ key: result.key });
	} catch {
		return Response.json(
			{ error: "Erreur lors de l'upload du fichier" },
			{ status: 500 },
		);
	}
}
