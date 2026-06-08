import { z } from "zod";

export const MAX_FILENAME_LENGTH = 200;

const CONTROL_CHARS_PATTERN = "[\\u0000-\\u001F]|\\u007F";
const FORBIDDEN_FILENAME_CHARS = new RegExp(
	`[<>:"|?*;/\\\\]|${CONTROL_CHARS_PATTERN}`,
);

const INVISIBLE_FILENAME_CHARS = /\u202E|\u200B|\u200C|\u200D|\uFEFF/u;

export const EXTENSION_MIME_MAP: Readonly<
	Record<string, ReadonlyArray<string>>
> = {
	".pdf": ["application/pdf"],
	".png": ["image/png"],
	".jpg": ["image/jpeg"],
	".jpeg": ["image/jpeg"],
};

export type FileNameError =
	| "empty"
	| "too_long"
	| "forbidden_char"
	| "invisible_char"
	| "extension_mime_mismatch";

export const FILENAME_ERROR_MESSAGES: Record<FileNameError, string> = {
	empty: "Le nom du fichier ne peut pas être vide.",
	too_long: "Le nom du fichier ne doit pas dépasser 200 caractères.",
	forbidden_char:
		'Le nom du fichier contient des caractères interdits (< > : " | ? * ; / \\).',
	invisible_char:
		"Le nom du fichier contient des caractères invisibles non autorisés.",
	extension_mime_mismatch:
		"L'extension du fichier ne correspond pas à son type.",
};

export function validateFileName(
	fileName: string,
	declaredMimeType: string,
): { ok: true } | { ok: false; reason: FileNameError; message: string } {
	const trimmed = fileName.trim();

	if (trimmed.length === 0) {
		return {
			ok: false,
			reason: "empty",
			message: FILENAME_ERROR_MESSAGES.empty,
		};
	}

	if (trimmed.length > MAX_FILENAME_LENGTH) {
		return {
			ok: false,
			reason: "too_long",
			message: FILENAME_ERROR_MESSAGES.too_long,
		};
	}

	if (FORBIDDEN_FILENAME_CHARS.test(trimmed)) {
		return {
			ok: false,
			reason: "forbidden_char",
			message: FILENAME_ERROR_MESSAGES.forbidden_char,
		};
	}

	if (INVISIBLE_FILENAME_CHARS.test(trimmed)) {
		return {
			ok: false,
			reason: "invisible_char",
			message: FILENAME_ERROR_MESSAGES.invisible_char,
		};
	}

	const lastDot = trimmed.lastIndexOf(".");
	if (lastDot === -1 || lastDot === trimmed.length - 1) {
		return {
			ok: false,
			reason: "extension_mime_mismatch",
			message: FILENAME_ERROR_MESSAGES.extension_mime_mismatch,
		};
	}

	const ext = trimmed.slice(lastDot).toLowerCase();
	const allowedMimes = EXTENSION_MIME_MAP[ext];

	if (!allowedMimes?.includes(declaredMimeType.toLowerCase())) {
		return {
			ok: false,
			reason: "extension_mime_mismatch",
			message: FILENAME_ERROR_MESSAGES.extension_mime_mismatch,
		};
	}

	return { ok: true };
}

export const fileNameSchema = z
	.object({ fileName: z.string(), mimeType: z.string() })
	.superRefine((data, ctx) => {
		const result = validateFileName(data.fileName, data.mimeType);
		if (!result.ok) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["fileName"],
				message: result.message,
				params: { reason: result.reason },
			});
		}
	});
