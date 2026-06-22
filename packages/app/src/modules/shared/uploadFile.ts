import type { FlowType } from "./uploadConfig";

export type UploadFailureReason =
	| "missing_flow"
	| "missing_filename"
	| "invalid_filename"
	| "wrong_type"
	| "too_large"
	| "empty"
	| "virus"
	| "max_files"
	| "not_found"
	| "scan_unavailable"
	| "unauthorized"
	| "server_error"
	| "aborted";

type UploadSuccess = { ok: true; fileId: string; fileName: string };
type UploadError = {
	ok: false;
	reason: UploadFailureReason;
	error: string;
	virusName?: string;
};

export type UploadFileResult = UploadSuccess | UploadError;

export type UploadFileOptions = {
	flowType: FlowType;
};

/**
 * Uploads a file to the unified upload endpoint. Runs in one HTTP request:
 * the server streams the file through ClamAV and S3, then inserts the DB row
 * atomically. On any failure after the S3 commit, the server compensates by
 * deleting the orphaned blob.
 *
 * The `flowType` option selects the target table logic (`cse_opinion` has a
 * max-4-files pre-check; `joint_evaluation` upserts the single row).
 */
export async function uploadFile(
	file: File,
	options: UploadFileOptions,
): Promise<UploadFileResult> {
	const response = await fetch("/api/upload", {
		method: "POST",
		headers: {
			"Content-Type": file.type || "application/octet-stream",
			"X-Filename": file.name,
			"X-Flow-Type": options.flowType,
		},
		body: file,
	});

	const data = (await response.json()) as Record<string, unknown>;

	if (!response.ok) {
		return {
			ok: false,
			reason: parseReason(response.status, data.reason),
			error: (data.error as string) ?? "Erreur lors de l'upload du fichier",
			virusName: (data.virus as string | undefined) ?? undefined,
		};
	}

	return {
		ok: true,
		fileId: data.fileId as string,
		fileName: data.fileName as string,
	};
}

const VALID_REASONS = new Set<UploadFailureReason>([
	"missing_flow",
	"missing_filename",
	"invalid_filename",
	"wrong_type",
	"too_large",
	"empty",
	"virus",
	"max_files",
	"not_found",
	"scan_unavailable",
	"unauthorized",
	"server_error",
	"aborted",
]);

function parseReason(status: number, raw: unknown): UploadFailureReason {
	if (
		typeof raw === "string" &&
		VALID_REASONS.has(raw as UploadFailureReason)
	) {
		return raw as UploadFailureReason;
	}
	// Fall back to a reason inferred from the HTTP status for early-exit paths
	// where the server returns 400/401 without a structured `reason` field.
	if (status === 401) return "unauthorized";
	if (status === 499) return "aborted";
	if (status === 400) return "wrong_type";
	return "server_error";
}
