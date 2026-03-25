import { fetchFileById } from "~/modules/export";
import { getFile } from "~/server/services/s3";

/**
 * GET /api/v1/files/:fileId
 *
 * Streams the file (PDF) from S3 for the given file ID.
 * Looks up in both CSE opinion files and joint evaluation files.
 */
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ fileId: string }> },
) {
	try {
		const { fileId } = await params;

		const file = await fetchFileById(fileId);
		if (!file) {
			return Response.json({ error: "Fichier non trouvé" }, { status: 404 });
		}

		const { body, contentType } = await getFile(file.filePath);
		const safeFileName = file.fileName.replace(/["\r\n]/g, "_");

		return new Response(body, {
			headers: {
				"Content-Type": contentType,
				"Content-Disposition": `attachment; filename="${safeFileName}"`,
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
