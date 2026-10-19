import { describe, expect, it } from "vitest";
import { UPLOAD_FLOW_TYPES } from "~/modules/shared/uploadConfig";
import type { PipelineFailureReason } from "~/server/services/uploadPipeline";
import { mapFailureToHttp, uploadAuditMetadataSchema } from "../uploadAudit";

describe("mapFailureToHttp", () => {
	it.each<[PipelineFailureReason, number, string]>([
		["not_found", 403, "HTTP 403 declaration_not_found"],
		["max_files", 400, "HTTP 400 max_files"],
		["formal_notice_unavailable", 403, "HTTP 403 formal_notice_unavailable"],
		["too_large", 400, "HTTP 400 too_large"],
		["wrong_type", 400, "HTTP 400 wrong_type"],
		["empty", 400, "HTTP 400 empty_file"],
		["virus", 422, "HTTP 422 virus_detected"],
		["scan_unavailable", 503, "HTTP 503 antivirus_unavailable"],
		["aborted", 499, "HTTP 499 client_aborted"],
		["server_error", 500, "HTTP 500 server_error"],
	])("maps %s to HTTP %i", (reason, status, errorMessage) => {
		expect(mapFailureToHttp(reason)).toEqual({ status, errorMessage });
	});
});

describe("uploadAuditMetadataSchema", () => {
	it.each(UPLOAD_FLOW_TYPES)("accepts the %s flow type", (flowType) => {
		expect(uploadAuditMetadataSchema.parse({ flowType })).toEqual({
			flowType,
		});
	});

	it("rejects an unknown flow type", () => {
		expect(
			uploadAuditMetadataSchema.safeParse({ flowType: "other" }).success,
		).toBe(false);
	});

	it("strips control characters from user-supplied names and clips them", () => {
		const result = uploadAuditMetadataSchema.parse({
			flowType: "formal_notice_joint_evaluation",
			fileName: `rapport\u001b[31m.pdf${"a".repeat(300)}`,
			virusName: "Eicar\u0007",
		});

		expect(result.fileName).toBe(
			`rapport[31m.pdf${"a".repeat(300)}`.slice(0, 255),
		);
		expect(result.virusName).toBe("Eicar");
	});
});
