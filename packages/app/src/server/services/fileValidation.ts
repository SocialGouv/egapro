import "server-only";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-

type ValidationResult = {
	valid: boolean;
	error?: string;
};

export function validatePdf(buffer: Buffer): ValidationResult {
	if (buffer.length === 0) {
		return { valid: false, error: "Le fichier est vide." };
	}

	if (buffer.length > MAX_FILE_SIZE) {
		return {
			valid: false,
			error: "Le fichier dépasse la taille maximale autorisée de 10 Mo.",
		};
	}

	const hasPdfSignature = PDF_MAGIC_BYTES.every(
		(byte, index) => buffer[index] === byte,
	);

	if (!hasPdfSignature) {
		return {
			valid: false,
			error: "Le fichier n'est pas un PDF valide.",
		};
	}

	return { valid: true };
}
