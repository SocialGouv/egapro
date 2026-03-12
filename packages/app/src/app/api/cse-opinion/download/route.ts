import { and, eq } from "drizzle-orm";

import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { cseOpinionFiles } from "~/server/db/schema";
import { getFile } from "~/server/services/s3";

export async function GET(request: Request) {
	const session = await auth();
	if (!session?.user?.siret) {
		return new Response("Non autorisé", { status: 401 });
	}

	const siren = session.user.siret.slice(0, 9);
	const url = new URL(request.url);
	const fileId = url.searchParams.get("id");

	if (!fileId) {
		return Response.json(
			{ error: "Identifiant de fichier manquant." },
			{ status: 400 },
		);
	}

	try {
		const [file] = await db
			.select({
				filePath: cseOpinionFiles.filePath,
				fileName: cseOpinionFiles.fileName,
			})
			.from(cseOpinionFiles)
			.where(
				and(
					eq(cseOpinionFiles.id, fileId),
					eq(cseOpinionFiles.siren, siren),
					eq(cseOpinionFiles.scanStatus, "clean"),
				),
			);

		if (!file) {
			return Response.json({ error: "Fichier introuvable." }, { status: 404 });
		}

		const { body, contentType } = await getFile(file.filePath);

		return new Response(body, {
			headers: {
				"Content-Type": contentType,
				"Content-Disposition": `attachment; filename="${file.fileName}"`,
			},
		});
	} catch (error) {
		console.error("[cse-opinion/download]", error);
		return Response.json(
			{ error: "Erreur lors du téléchargement du fichier." },
			{ status: 500 },
		);
	}
}
