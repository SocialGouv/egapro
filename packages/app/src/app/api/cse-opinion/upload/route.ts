import { getCseYear } from "~/server/api/shared/sessionHelpers";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { cseOpinionFiles } from "~/server/db/schema";
import { scanBuffer } from "~/server/services/clamav";
import { validatePdf } from "~/server/services/fileValidation";
import { buildObjectKey, uploadFile } from "~/server/services/s3";

export async function POST(request: Request) {
	const session = await auth();
	if (!session?.user?.siret) {
		return new Response("Non autorisé", { status: 401 });
	}

	const siren = session.user.siret.slice(0, 9);
	const year = getCseYear();

	try {
		const formData = await request.formData();
		const file = formData.get("file");

		if (!file || !(file instanceof File)) {
			return Response.json({ error: "Aucun fichier fourni." }, { status: 400 });
		}

		const buffer = Buffer.from(await file.arrayBuffer());

		// Validate PDF (magic bytes + size)
		const validation = validatePdf(buffer);
		if (!validation.valid) {
			return Response.json({ error: validation.error }, { status: 400 });
		}

		// Antivirus scan before storage
		let scanResult: Awaited<ReturnType<typeof scanBuffer>>;
		try {
			scanResult = await scanBuffer(buffer);
		} catch {
			return Response.json(
				{
					error:
						"Le service antivirus est indisponible. Veuillez réessayer plus tard.",
				},
				{ status: 503 },
			);
		}

		if (!scanResult.clean) {
			return Response.json(
				{
					error: "Le fichier a été rejeté par l'antivirus.",
					viruses: scanResult.viruses,
				},
				{ status: 422 },
			);
		}

		// Upload to S3
		const fileId = crypto.randomUUID();
		const objectKey = buildObjectKey(siren, year, fileId);
		await uploadFile(objectKey, buffer, "application/pdf");

		// Insert DB record
		const [inserted] = await db
			.insert(cseOpinionFiles)
			.values({
				id: fileId,
				siren,
				year,
				fileName: file.name,
				filePath: objectKey,
				fileSize: buffer.length,
				scanStatus: "clean",
				declarantId: session.user.id,
			})
			.returning({
				id: cseOpinionFiles.id,
				fileName: cseOpinionFiles.fileName,
				fileSize: cseOpinionFiles.fileSize,
				uploadedAt: cseOpinionFiles.uploadedAt,
			});

		return Response.json(inserted);
	} catch (error) {
		console.error("[cse-opinion/upload]", error);
		return Response.json(
			{ error: "Erreur lors de l'upload du fichier." },
			{ status: 500 },
		);
	}
}
