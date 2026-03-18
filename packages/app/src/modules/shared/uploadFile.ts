type UploadSuccess = { ok: true; key: string };
type UploadError = { ok: false; error: string; virus?: string };

export type UploadFileResult = UploadSuccess | UploadError;

/**
 * Uploads a file to the server via the streaming upload endpoint.
 * The file is sent as raw binary with the filename in a header.
 */
export async function uploadFile(file: File): Promise<UploadFileResult> {
	const response = await fetch("/api/upload", {
		method: "POST",
		headers: {
			"Content-Type": file.type || "application/octet-stream",
			"X-Filename": file.name,
		},
		body: file,
	});

	const data = (await response.json()) as Record<string, unknown>;

	if (!response.ok) {
		return {
			ok: false,
			error: (data.error as string) ?? "Erreur lors de l'upload du fichier",
			virus: data.virus as string | undefined,
		};
	}

	return { ok: true, key: data.key as string };
}
