import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockInsertValues, mockEmitActivityLog } = vi.hoisted(() => ({
	mockInsertValues: vi.fn(),
	mockEmitActivityLog: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: {
		insert: () => ({ values: mockInsertValues }),
	},
}));

vi.mock("~/server/db/auditSchema", () => ({
	actionLogs: { __mock: "actionLogs" },
}));

// Keeps deriveErrorCode real (logAction relies on it) while spying on what is handed to the stdout mirror.
vi.mock("../activityLog", async (importOriginal) => {
	const actual = await importOriginal<typeof import("../activityLog")>();
	return {
		...actual,
		emitActivityLog: (...args: unknown[]) => mockEmitActivityLog(...args),
	};
});

const { logAction } = await import("../log");
const { AUDIT_ACTIONS } = await import("~/modules/audit");

describe("logAction", () => {
	beforeEach(() => {
		mockInsertValues.mockReset();
		mockInsertValues.mockResolvedValue(undefined);
		mockEmitActivityLog.mockReset();
	});

	it("inserts a row with all provided fields and resolves the category from the action key", async () => {
		const userId = "123e4567-e89b-12d3-a456-426614174000";
		await logAction({
			action: AUDIT_ACTIONS.DECLARATION_SUBMIT,
			status: "success",
			userId,
			userEmail: "test@example.com",
			siren: "123456789",
			metadata: { year: 2026 },
			ipAddress: "1.2.3.4",
			userAgent: "Mozilla",
			durationMs: 42,
		});

		expect(mockInsertValues).toHaveBeenCalledOnce();
		const row = mockInsertValues.mock.calls[0]?.[0];
		expect(row).toMatchObject({
			action: "declaration.submit",
			category: "mutation",
			status: "success",
			userId,
			userEmail: null,
			siren: "123456789",
			metadata: { year: 2026 },
			ipAddress: "1.2.0.0",
			userAgent: null,
			durationMs: 42,
		});
	});

	it("normalizes optional fields to null when omitted", async () => {
		await logAction({
			action: AUDIT_ACTIONS.AUTH_LOGIN,
			status: "success",
		});

		const row = mockInsertValues.mock.calls[0]?.[0];
		expect(row).toMatchObject({
			action: "auth.login",
			category: "auth",
			userId: null,
			userEmail: null,
			siren: null,
			metadata: null,
			ipAddress: null,
			userAgent: null,
			durationMs: null,
		});
	});

	it("rejects free, nested and forged metadata from a direct call", async () => {
		await logAction({
			action: AUDIT_ACTIONS.DECLARATION_SUBMIT,
			status: "failure",
			metadata: {
				year: "2026<script>",
				fileName: "private.pdf",
				phone: "0612345678",
				nested: { secret: "value" },
			},
			ipAddress: "203.0.113.4:1234",
			errorMessage: "MY_PRIVATE_VALUE: secret",
		});

		expect(mockInsertValues.mock.calls[0]?.[0]).toMatchObject({
			metadata: null,
			ipAddress: null,
			errorMessage: "ERROR",
		});
	});

	it("keeps only validated action metadata and truncates IPv6", async () => {
		await logAction({
			action: AUDIT_ACTIONS.PDF_PREFILL_DOWNLOAD,
			status: "success",
			metadata: {
				year: "2026",
				invalidYear: false,
				fileName: "private.pdf",
			},
			ipAddress: "2001:db8:abcd:1234::1",
		});

		expect(mockInsertValues.mock.calls[0]?.[0]).toMatchObject({
			metadata: { year: 2026, invalidYear: false },
			ipAddress: "2001:db8:abcd::",
		});
	});

	it("keeps a technical resource UUID and rejects arbitrary resource text", async () => {
		const id = "123e4567-e89b-12d3-a456-426614174000";
		await logAction({
			action: AUDIT_ACTIONS.DECLARATION_LOCK_ACQUIRED,
			status: "success",
			resourceType: "declaration",
			resourceId: id,
		});
		expect(mockInsertValues.mock.calls[0]?.[0]).toMatchObject({
			resourceType: "declaration",
			resourceId: id,
		});

		await logAction({
			action: AUDIT_ACTIONS.DECLARATION_LOCK_ACQUIRED,
			status: "failure",
			resourceType: "person@example.com",
			resourceId: "private@example.com",
		});
		expect(mockInsertValues.mock.calls[1]?.[0]).toMatchObject({
			resourceType: null,
			resourceId: null,
		});
	});

	it("rejects free text in attribution fields", async () => {
		await logAction({
			action: AUDIT_ACTIONS.AUTH_LOGIN,
			status: "success",
			userId: "person@example.com",
			siren: "123456789 extra",
		});
		expect(mockInsertValues.mock.calls[0]?.[0]).toMatchObject({
			userId: null,
			siren: null,
		});
	});

	it("keeps only a validated file UUID for a download", async () => {
		const fileId = "45becf58-fdd2-428f-9a55-582a86e88592";
		await logAction({
			action: AUDIT_ACTIONS.USER_FILE_DOWNLOAD,
			status: "success",
			metadata: { fileId, fileName: "private.pdf" },
		});
		expect(mockInsertValues.mock.calls[0]?.[0]?.metadata).toEqual({ fileId });

		await logAction({
			action: AUDIT_ACTIONS.USER_FILE_DOWNLOAD,
			status: "failure",
			metadata: { fileId: "private@example.com", fileName: "private.pdf" },
		});
		expect(mockInsertValues.mock.calls[1]?.[0]?.metadata).toBeNull();
	});

	it("keeps the signed SUIT download target without its filename", async () => {
		const fileId = "6b3573f8-8723-45c9-98a0-641431843ddd";
		await logAction({
			action: AUDIT_ACTIONS.EXPORT_API_FILES,
			status: "success",
			metadata: { fileId, fileName: "f.pdf", year: "2026" },
		});
		expect(mockInsertValues.mock.calls[0]?.[0]?.metadata).toEqual({
			fileId,
			year: 2026,
		});
	});

	it("keeps the validated XLSX export format", async () => {
		await logAction({
			action: AUDIT_ACTIONS.PUBLIC_REPRESENTATIONS_EXPORT,
			status: "success",
			metadata: { format: "xlsx", search: "private@example.com" },
		});
		expect(mockInsertValues.mock.calls[0]?.[0]?.metadata).toEqual({
			format: "xlsx",
		});
	});

	it("keeps bounded upload cleanup and security failure codes", async () => {
		await logAction({
			action: AUDIT_ACTIONS.CSE_OPINION_UPLOAD_FILE,
			status: "failure",
			errorMessage: "HTTP 422 virus_detected",
			metadata: { s3Cleanup: "failed", virusName: "private" },
		});
		expect(mockInsertValues.mock.calls[0]?.[0]).toMatchObject({
			errorMessage: "HTTP_422_virus_detected",
			metadata: { s3Cleanup: "failed" },
		});

		await logAction({
			action: AUDIT_ACTIONS.CSE_OPINION_UPLOAD_FILE,
			status: "failure",
			errorMessage: "HTTP 403 impersonation_read_only",
			metadata: { s3Cleanup: "unexpected" },
		});
		expect(mockInsertValues.mock.calls[1]?.[0]).toMatchObject({
			errorMessage: "HTTP_403_impersonation_read_only",
			metadata: null,
		});
	});

	it("keeps the controlled values of audited settings changes", async () => {
		await logAction({
			action: AUDIT_ACTIONS.COMPANY_UPDATE_HAS_CSE,
			status: "success",
			metadata: { siren: "123456789", hasCse: false, name: "private" },
		});
		expect(mockInsertValues.mock.calls[0]?.[0]?.metadata).toEqual({
			siren: "123456789",
			hasCse: false,
		});

		await logAction({
			action: AUDIT_ACTIONS.ADMIN_SETTINGS_UPSERT_DEADLINES,
			status: "success",
			metadata: {
				year: 2026,
				campaignStartDate: "",
				publicDataReleaseDate: "2026-04-01",
				decl1ModificationDeadline: "2026-05-01",
				decl2CseOpinionDeadline: "2026-13-99",
				freeText: "private@example.com",
			},
		});
		expect(mockInsertValues.mock.calls[1]?.[0]?.metadata).toEqual({
			year: 2026,
			decl1ModificationDeadline: "2026-05-01",
		});

		await logAction({
			action: AUDIT_ACTIONS.ADMIN_SETTINGS_UPDATE_COMMON_CALENDAR,
			status: "success",
			metadata: {
				year: 2027,
				campaignStartDate: "2027-03-15",
				publicDataReleaseDate: "2028-01-15",
				freeText: "private@example.com",
			},
		});
		expect(mockInsertValues.mock.calls[2]?.[0]?.metadata).toEqual({
			year: 2027,
			campaignStartDate: "2027-03-15",
			publicDataReleaseDate: "2028-01-15",
		});

		await logAction({
			action: AUDIT_ACTIONS.ADMIN_SETTINGS_UPSERT_REPRESENTATION_CAMPAIGN,
			status: "success",
			metadata: {
				year: 2026,
				campaignStartDate: "2026-01-01",
				campaignEndDate: "2026-12-31",
				declarationDeadline: "2026-06-30",
				secret: "private@example.com",
			},
		});
		expect(mockInsertValues.mock.calls[3]?.[0]?.metadata).toEqual({
			year: 2026,
			campaignStartDate: "2026-01-01",
			campaignEndDate: "2026-12-31",
			declarationDeadline: "2026-06-30",
		});
	});

	it("keeps fixed NextAuth failure codes without error details", async () => {
		for (const code of [
			"JWT_SESSION_ERROR",
			"OAUTH_CALLBACK_HANDLER_ERROR",
			"OAUTH_PARSE_PROFILE_ERROR",
		]) {
			await logAction({
				action: AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
				status: "failure",
				errorMessage: `${code}: private@example.com`,
			});
		}
		expect(
			mockInsertValues.mock.calls.map(([row]) => row.errorMessage),
		).toEqual([
			"JWT_SESSION_ERROR",
			"OAUTH_CALLBACK_HANDLER_ERROR",
			"OAUTH_PARSE_PROFILE_ERROR",
		]);
	});

	it("retains only the public-agent signal from role claims", async () => {
		await logAction({
			action: AUDIT_ACTIONS.AUTH_ADMIN_MFA,
			status: "failure",
			metadata: {
				roles: ["private_role", "agent_public"],
				publicAgentRequired: true,
			},
		});
		expect(mockInsertValues.mock.calls[0]?.[0]?.metadata).toEqual({
			roles: ["agent_public"],
			publicAgentRequired: true,
		});
	});

	it("never throws even when the database insert fails", async () => {
		mockInsertValues.mockRejectedValueOnce(new Error("db down"));
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		await expect(
			logAction({
				action: AUDIT_ACTIONS.AUTH_LOGIN,
				status: "failure",
			}),
		).resolves.toBeUndefined();
		expect(consoleSpy).toHaveBeenCalled();

		consoleSpy.mockRestore();
	});

	it("accepts an explicit category override", async () => {
		await logAction({
			action: AUDIT_ACTIONS.AUTH_LOGIN,
			status: "success",
			category: "system",
		});
		expect(mockInsertValues.mock.calls[0]?.[0]).toMatchObject({
			category: "system",
		});
	});

	describe("stdout activity log mirror (#3705)", () => {
		it("emits before inserting, carrying the resolved category and the origin", async () => {
			const callOrder: string[] = [];
			mockEmitActivityLog.mockImplementation(() => callOrder.push("emit"));
			mockInsertValues.mockImplementation(async () => {
				callOrder.push("insert");
			});

			await logAction({
				action: AUDIT_ACTIONS.DECLARATION_SUBMIT,
				status: "success",
				userId: "user-1",
				siren: "123456789",
				metadata: { year: 2026 },
				ipAddress: "203.0.113.45",
				durationMs: 42,
				origin: {
					source: "trpc",
					route: "declaration.submit",
					operation: "mutation",
				},
			});

			expect(callOrder).toEqual(["emit", "insert"]);
			expect(mockEmitActivityLog).toHaveBeenCalledOnce();
			expect(mockEmitActivityLog.mock.calls[0]?.[0]).toMatchObject({
				source: "trpc",
				action: "declaration.submit",
				category: "mutation",
				route: "declaration.submit",
				operation: "mutation",
				status: "success",
				durationMs: 42,
				userId: "user-1",
				siren: "123456789",
				ip: "203.0.113.45",
				rawInput: { year: 2026 },
			});
		});

		it("mirrors origin.rawInput instead of the persisted metadata when the origin carries it", async () => {
			await logAction({
				action: AUDIT_ACTIONS.REPRESENTATION_SAVE_DRAFT,
				status: "success",
				metadata: { year: 2026 },
				origin: {
					source: "trpc",
					route: "representationDeclaration.saveDraft",
					operation: "mutation",
					rawInput: { year: 2026, executiveWomenPercent: 60 },
				},
			});

			expect(mockEmitActivityLog.mock.calls[0]?.[0]).toMatchObject({
				rawInput: { year: 2026, executiveWomenPercent: 60 },
			});
		});

		it("falls back to metadata when origin does not carry a raw input (route / direct calls)", async () => {
			await logAction({
				action: AUDIT_ACTIONS.DECLARATION_SUBMIT,
				status: "success",
				metadata: { year: 2026 },
			});

			expect(mockEmitActivityLog.mock.calls[0]?.[0]).toMatchObject({
				rawInput: { year: 2026 },
			});
		});

		it("defaults origin fields to null for a direct call (auth events, crons…)", async () => {
			await logAction({
				action: AUDIT_ACTIONS.AUTH_LOGIN,
				status: "success",
			});

			expect(mockEmitActivityLog.mock.calls[0]?.[0]).toMatchObject({
				source: null,
				route: null,
				operation: null,
			});
		});

		it("derives the stdout errorCode from errorMessage", async () => {
			await logAction({
				action: AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
				status: "failure",
				errorMessage: "OAUTH_CALLBACK_ERROR: {}",
			});

			expect(mockEmitActivityLog.mock.calls[0]?.[0]).toMatchObject({
				errorCode: "OAUTH_CALLBACK_ERROR",
			});
		});

		it("hands only the NextAuth error code to the mirror, never a token carried by its message (S9)", async () => {
			await logAction({
				action: AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
				status: "failure",
				errorMessage:
					"OAUTH_CALLBACK_ERROR: invalid_grant for code fake-session-token-value",
				ipAddress: "203.0.113.45",
			});

			const mirrored = mockEmitActivityLog.mock.calls[0]?.[0];
			expect(mirrored).toMatchObject({
				action: "auth.login_failed",
				status: "failure",
				errorCode: "OAUTH_CALLBACK_ERROR",
			});
			expect(JSON.stringify(mirrored)).not.toContain(
				"fake-session-token-value",
			);
			expect(mockInsertValues.mock.calls[0]?.[0]).toMatchObject({
				errorMessage: "OAUTH_CALLBACK_ERROR",
			});
		});

		it("reduces a long free-form error to a controlled code", async () => {
			const longMessage = "a".repeat(2000);

			await logAction({
				action: AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
				status: "failure",
				errorMessage: longMessage,
			});

			const row = mockInsertValues.mock.calls[0]?.[0];
			expect(row?.errorMessage).toBe("ERROR");
		});

		it("does not persist Unicode error content", async () => {
			const surrogatePairEmoji = "😀";
			const longMessage = "a".repeat(500) + surrogatePairEmoji;

			await logAction({
				action: AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
				status: "failure",
				errorMessage: longMessage,
			});

			const row = mockInsertValues.mock.calls[0]?.[0];
			expect(row?.errorMessage).toBe("ERROR");
		});

		it("persists only the code from a short errorMessage", async () => {
			await logAction({
				action: AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
				status: "failure",
				errorMessage: "BAD_REQUEST: invalid input",
			});

			const row = mockInsertValues.mock.calls[0]?.[0];
			expect(row?.errorMessage).toBe("BAD_REQUEST");
		});

		it("uses the same short code for stdout and the database", async () => {
			const longMessage = `BAD_REQUEST: ${"x".repeat(2000)}`;

			await logAction({
				action: AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
				status: "failure",
				errorMessage: longMessage,
			});

			expect(mockEmitActivityLog.mock.calls[0]?.[0]).toMatchObject({
				errorCode: "BAD_REQUEST",
			});
			const row = mockInsertValues.mock.calls[0]?.[0];
			expect(row?.errorMessage).toBe("BAD_REQUEST");
		});

		// A failure while building or emitting the stdout line must never block the DB insert, nor make logAction reject.
		it("still inserts and resolves when the stdout mirror throws", async () => {
			const consoleSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});
			mockEmitActivityLog.mockImplementation(() => {
				throw new Error("line construction failed");
			});

			await expect(
				logAction({
					action: AUDIT_ACTIONS.AUTH_LOGIN,
					status: "success",
				}),
			).resolves.toBeUndefined();

			expect(mockInsertValues).toHaveBeenCalledOnce();
			expect(consoleSpy).toHaveBeenCalled();

			consoleSpy.mockRestore();
		});
	});
});
