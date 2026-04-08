import { fetchFileBySiren } from "~/modules/export";
import { parseSiren } from "~/modules/shared";
import { auth } from "~/server/auth";
import { getFile } from "~/server/services/s3";

function buildContentDisposition(fileName: string): string {
	const asciiFallback = fileName
		.replace(/[^\x20-\x7E]/g, "_")
		.replace(/["\\;\r\n]/g, "_");
	const encodedFileName = encodeURIComponent(fileName);

	return `inline; filename="${asciiFallback}"; filename*=UTF-8''${encodedFileName}`;
}

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
	const siren = parseSiren(session?.user?.siret);

	if (!session?.user || !siren) {
		return Response.json({ error: "Non authentifié" }, { status: 401 });
	}

	try {
		const { fileId } = await params;

		const file = await fetchFileBySiren(fileId, siren);
		if (!file) {
			return Response.json({ error: "Fichier non trouvé" }, { status: 404 });
		}

		const { body, contentType } = await getFile(file.filePath);
		const contentDisposition = buildContentDisposition(file.fileName);

		return new Response(body, {
			headers: {
				"Content-Type": contentType,
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
