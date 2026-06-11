/** Maximum file size in bytes (10 MB). */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Human-readable max file size (e.g. "10 Mo"). */
export const MAX_FILE_SIZE_LABEL = `${MAX_FILE_SIZE / (1024 * 1024)} Mo`;

/** Error message when file exceeds the size limit. */
export const FILE_TOO_LARGE_ERROR = `La taille du fichier ne doit pas dépasser ${MAX_FILE_SIZE_LABEL}.`;

/**
 * Formats a byte count as a French file-size label ("61,88 Ko", "1,2 Mo").
 * Returns null when the size is unknown so callers can omit it entirely.
 */
export function formatFileSize(bytes: number | null): string | null {
	if (bytes === null || bytes < 0) return null;
	const ONE_KO = 1024;
	const ONE_MO = ONE_KO * 1024;
	const formatter = new Intl.NumberFormat("fr-FR", {
		maximumFractionDigits: 2,
	});
	if (bytes < ONE_MO) {
		return `${formatter.format(bytes / ONE_KO)} Ko`;
	}
	return `${formatter.format(bytes / ONE_MO)} Mo`;
}

/** MIME types accepted by the upload endpoint. Validated server-side via magic bytes. */
export const ALLOWED_UPLOAD_MIME_TYPES = [
	"application/pdf",
	"image/png",
	"image/jpeg",
] as const;

/** ClamAV scan timeout in milliseconds (30s). */
export const SCAN_TIMEOUT_MS = 30_000;

/**
 * Overall upload pipeline timeout (2min). Combined via AbortSignal.any with
 * the incoming request signal so a hung clamd or S3 socket aborts the whole
 * pipeline instead of tying up the request indefinitely.
 */
export const UPLOAD_REQUEST_TIMEOUT_MS = 120_000;

/** Minimum S3 multipart part size in bytes (5 MB, required by S3 except for the last part). */
export const S3_PART_MIN_SIZE = 5 * 1024 * 1024;

/**
 * Upload flow dispatched by `/api/upload` via the `X-Flow-Type` header.
 * Mirrors the `files.type` enum on the server.
 */
export type FlowType = "cse_opinion" | "joint_evaluation";
