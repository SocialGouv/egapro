import { fetchFileBySiren } from "~/modules/export";
import { parseSiren } from "~/modules/shared";
import { ALLOWED_UPLOAD_MIME_TYPES } from "~/modules/shared/uploadConfig";
import { auth } from "~/server/auth";
import { buildContentDisposition, getFile } from "~/server/services/s3";

const ALLOWED_CONTENT_TYPES: ReadonlySet<string> = new Set(
	ALLOWED_UPLOAD_MIME_TYPES,
);

/**
 * GET /api/download/:fileId
 *
 * Proxy route for authenticated users to view their uploaded files (PDF, JPEG, PNG).
 * Streams the file from S3 with Content-Disposition: inline so the browser displays it.
 *
 * Security: requires a valid session and verifies the file belongs to the user's SIREN.
 */
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ fileId: string }> },
) {
	const session = await auth();
	if (!session?.user) {
		return Response.json({ error: "Non authentifié" }, { status: 401 });
	}

	const siren = parseSiren(session.user.siret);
	if (!siren) {
		return Response.json({ error: "Non authentifié" }, { status: 401 });
	}

	try {
		const { fileId } = await params;

		const file = await fetchFileBySiren(fileId, siren);
		if (!file) {
			return Response.json({ error: "Fichier non trouvé" }, { status: 404 });
		}

		const { body, contentType } = await getFile(file.filePath);
		const safeContentType = ALLOWED_CONTENT_TYPES.has(contentType)
			? contentType
			: "application/octet-stream";
		const contentDisposition = buildContentDisposition(file.fileName, "inline");

		return new Response(body, {
			headers: {
				"Content-Type": safeContentType,
				"Content-Disposition": contentDisposition,
				"Cache-Control": "private, no-store",
			},
		});
	} catch (error) {
		console.error("[api/download/:fileId]", error);
		return Response.json(
			{ error: "Erreur lors de la récupération du fichier" },
			{ status: 500 },
		);
	}
}
