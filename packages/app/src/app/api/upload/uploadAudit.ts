import { z } from "zod";
import type { AuditActionKey } from "~/modules/audit";
import type { FlowType } from "~/modules/shared/uploadConfig";
import { logAction } from "~/server/audit/log";
import type { RequestContext } from "~/server/audit/requestContext";
import type { PipelineFailureReason } from "~/server/services/uploadPipeline";

export function mapFailureToHttp(reason: PipelineFailureReason): {
	status: number;
	errorMessage: string;
} {
	switch (reason) {
		case "not_found":
			return { status: 403, errorMessage: "HTTP 403 declaration_not_found" };
		case "max_files":
			return { status: 400, errorMessage: "HTTP 400 max_files" };
		case "too_large":
			return { status: 400, errorMessage: "HTTP 400 too_large" };
		case "wrong_type":
			return { status: 400, errorMessage: "HTTP 400 wrong_type" };
		case "empty":
			return { status: 400, errorMessage: "HTTP 400 empty_file" };
		case "virus":
			return { status: 422, errorMessage: "HTTP 422 virus_detected" };
		case "scan_unavailable":
			return { status: 503, errorMessage: "HTTP 503 antivirus_unavailable" };
		case "aborted":
			// 499 is the nginx-style "client closed request" status. The body is
			// never consumed by the client (they are gone), so the status is
			// purely for server-side observability.
			return { status: 499, errorMessage: "HTTP 499 client_aborted" };
		case "server_error":
			return { status: 500, errorMessage: "HTTP 500 server_error" };
	}
}

// Strips control characters (including ANSI escape sequences) and clips to
// 255 chars before a user-supplied string is persisted to the audit log or
// echoed to a terminal via console.error: a crafted header could carry escape
// sequences that mislead log readers.
function sanitizeUserText(value: string): string {
	let out = "";
	for (const ch of value) {
		const code = ch.codePointAt(0) ?? 0;
		if (code >= 0x20 && code !== 0x7f) out += ch;
	}
	return out.slice(0, 255);
}

// Fields sourced from user input (fileName, virusName) use `sanitizedUserString`
// so future additions to the schema are sanitised by construction.
const sanitizedUserString = z.string().transform(sanitizeUserText);

export const uploadAuditMetadataSchema = z.object({
	flowType: z.enum(["cse_opinion", "joint_evaluation"]),
	fileId: z.string().optional(),
	fileName: sanitizedUserString.optional(),
	virusName: sanitizedUserString.optional(),
	s3Cleanup: z.enum(["ok", "failed"]).optional(),
});

type AuditFailureInput = {
	action: AuditActionKey;
	flowType: FlowType;
	fileName: string | null;
	fileId: string | null;
	errorMessage: string;
	userId: string | null;
	userEmail: string | null;
	siren: string | null;
	requestContext: RequestContext;
	startedAt: number;
	virusName?: string | null;
	s3Cleanup?: "ok" | "failed" | null;
};

export function writeFailure({
	action,
	flowType,
	fileName,
	fileId,
	errorMessage,
	userId,
	userEmail,
	siren,
	requestContext,
	startedAt,
	virusName = null,
	s3Cleanup = null,
}: AuditFailureInput): void {
	const metadata = uploadAuditMetadataSchema.parse({
		flowType,
		fileName: fileName ?? undefined,
		fileId: fileId ?? undefined,
		virusName: virusName ?? undefined,
		s3Cleanup: s3Cleanup ?? undefined,
	});

	void logAction({
		action,
		status: "failure",
		userId,
		userEmail,
		siren,
		metadata,
		errorMessage,
		ipAddress: requestContext.ipAddress,
		userAgent: requestContext.userAgent,
		durationMs: Date.now() - startedAt,
	});
}
