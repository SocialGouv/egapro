import { getCurrentYear } from "~/modules/domain";
import { parseSiren } from "~/modules/shared/parseSiren";
import { ALLOWED_UPLOAD_MIME_TYPES } from "~/modules/shared/uploadConfig";
import { auth } from "~/server/auth";
import { handleStreamingUpload } from "~/server/services/fileUpload";

export async function POST(request: Request) {
	const session = await auth();
	const siren = parseSiren(session?.user?.siret);

	if (!session?.user || !siren) {
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

	const contentType =
		request.headers.get("content-type") ?? "application/octet-stream";

	const isAllowedType = (
		ALLOWED_UPLOAD_MIME_TYPES as readonly string[]
	).includes(contentType);
	if (!isAllowedType) {
		return Response.json(
			{
				error: `Type de fichier non autorisé : ${contentType}. Types acceptés : ${ALLOWED_UPLOAD_MIME_TYPES.join(", ")}.`,
			},
			{ status: 400 },
		);
	}

	const year = getCurrentYear();

	try {
		const result = await handleStreamingUpload(request.body, {
			siren,
			year,
			fileName,
			contentType,
			allowedMimeTypes: ALLOWED_UPLOAD_MIME_TYPES,
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
