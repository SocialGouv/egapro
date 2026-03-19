import "server-only";

/**
 * Known file signatures (magic bytes) for server-side content validation.
 * This prevents clients from uploading disguised files.
 */
const FILE_SIGNATURES: Record<string, number[]> = {
	"application/pdf": [0x25, 0x50, 0x44, 0x46, 0x2d], // %PDF-
	"image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
	"image/jpeg": [0xff, 0xd8, 0xff],
};

/** Minimum bytes needed to check any signature. */
export const MIN_SIGNATURE_BYTES = 8;

type ValidationResult =
	| { valid: true; detectedType: string }
	| { valid: false; error: string };

/**
 * Validates that the file header matches one of the allowed MIME types
 * by checking magic bytes. Rejects files whose actual content does not
 * match any allowed signature.
 */
export function validateFileSignature(
	headerBytes: Buffer,
	allowedMimeTypes: readonly string[],
): ValidationResult {
	if (headerBytes.length === 0) {
		return { valid: false, error: "Le fichier est vide." };
	}

	for (const mimeType of allowedMimeTypes) {
		const signature = FILE_SIGNATURES[mimeType];
		if (!signature) continue;

		if (headerBytes.length < signature.length) continue;

		const matches = signature.every(
			(byte, index) => headerBytes[index] === byte,
		);
		if (matches) {
			return { valid: true, detectedType: mimeType };
		}
	}

	return {
		valid: false,
		error:
			"Format de fichier non supporté. Le contenu ne correspond pas aux formats autorisés.",
	};
}
