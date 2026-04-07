import { fetchFileById } from "~/modules/export";
import { getFile } from "~/server/services/s3";
import { verifySuitApiKey } from "~/server/services/suitApiAuth";

function buildContentDisposition(fileName: string): string {
	const asciiFallback = fileName
		.replace(/[^\x20-\x7E]/g, "_")
		.replace(/["\\;\r\n]/g, "_");
	const encodedFileName = encodeURIComponent(fileName);

	return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodedFileName}`;
}

/**
 * GET /api/v1/files/:fileId
 *
 * Secured REST API streaming the file (PDF) from S3.
 * Requires a valid SUIT API key in the Authorization: Bearer header.
 */
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ fileId: string }> },
) {
	const authResult = verifySuitApiKey(request);
	if (authResult !== true) return authResult;

	try {
		const { fileId } = await params;

		const file = await fetchFileById(fileId);
		if (!file) {
			return Response.json({ error: "Fichier non trouvé" }, { status: 404 });
		}

		const { body, contentType } = await getFile(file.filePath);
		const contentDisposition = buildContentDisposition(file.fileName);

		return new Response(body, {
			headers: {
				"Content-Type": contentType,
				"Content-Disposition": contentDisposition,
				"Cache-Control": "private, max-age=3600",
			},
		});
	} catch (error) {
		console.error("[api/v1/files/:fileId]", error);
		return Response.json(
			{ error: "Erreur lors du téléchargement du fichier" },
			{ status: 500 },
		);
	}
}
