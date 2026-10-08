import { describe, expect, it } from "vitest";
import { cleanupErrorDiagnostic } from "#scripts/cleanup-error-diagnostic";

describe("cleanupErrorDiagnostic", () => {
	it("keeps only a SQLSTATE from a nested database error", () => {
		expect(
			cleanupErrorDiagnostic({
				message: "query failed for private@example.com",
				cause: { code: "42501", detail: "private@example.com" },
			}),
		).toBe("SQLSTATE_42501");
	});

	it("keeps only the bounded HTTP status from an S3 error", () => {
		expect(
			cleanupErrorDiagnostic({
				name: "AccessDenied for 123456789/private.pdf",
				$metadata: { httpStatusCode: 403 },
			}),
		).toBe("HTTP_403");
	});

	it("discards arbitrary error text and malformed codes", () => {
		expect(
			cleanupErrorDiagnostic({
				code: "PRIVATE_DATA",
				message: "private@example.com",
			}),
		).toBe("UNKNOWN");
	});

	it("keeps bounded connection failure codes", () => {
		expect(cleanupErrorDiagnostic({ code: "ECONNREFUSED" })).toBe(
			"ECONNREFUSED",
		);
		expect(cleanupErrorDiagnostic({ code: "CONNECT_TIMEOUT" })).toBe(
			"CONNECT_TIMEOUT",
		);
	});
});
