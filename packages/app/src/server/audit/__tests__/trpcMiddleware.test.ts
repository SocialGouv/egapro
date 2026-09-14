import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockLogAction = vi.fn();
vi.mock("../log", () => ({
	logAction: (...args: unknown[]) => mockLogAction(...args),
}));

const mockEmitActivityLog = vi.fn();
vi.mock("../activityLog", () => ({
	emitActivityLog: (...args: unknown[]) => mockEmitActivityLog(...args),
}));

const { auditMiddleware } = await import("../trpcMiddleware");

function buildCtx(siret: string | null = "12345678900012") {
	return {
		session: {
			user: {
				id: "user-1",
				email: "user@example.com",
				siret,
			},
		},
		headers: new Headers({
			"x-forwarded-for": "203.0.113.10",
			"user-agent": "TestAgent",
		}),
	};
}

function buildGetRawInput(value: unknown) {
	return async () => value;
}

/** Shape of a real tRPC `MiddlewareResult` — see #3705 §5. */
function okResult(data: unknown) {
	return { ok: true as const, marker: "middlewareMarker", data };
}

function errorResult(error: TRPCError) {
	return { ok: false as const, marker: "middlewareMarker", error };
}

describe("auditMiddleware", () => {
	beforeEach(() => {
		mockLogAction.mockClear();
		mockEmitActivityLog.mockClear();
	});

	it("skips the DB row but still emits a stdout line when the path is not in the action map", async () => {
		const next = vi.fn(async () => okResult("result"));
		const result = await auditMiddleware({
			ctx: buildCtx(),
			type: "query",
			path: "cseOpinion.getFiles",
			getRawInput: buildGetRawInput(undefined),
			next,
		});

		expect(result).toEqual(okResult("result"));
		expect(next).toHaveBeenCalledOnce();
		expect(mockLogAction).not.toHaveBeenCalled();
		expect(mockEmitActivityLog).toHaveBeenCalledOnce();
		expect(mockEmitActivityLog.mock.calls[0]?.[0]).toMatchObject({
			source: "trpc",
			action: null,
			category: null,
			route: "cseOpinion.getFiles",
			operation: "query",
			status: "success",
			errorCode: null,
			userId: "user-1",
			siren: "123456789",
			ip: "203.0.113.10",
		});
	});

	it("emits a failure stdout line when an unmapped path's next() resolves ok:false", async () => {
		const error = new TRPCError({
			code: "UNAUTHORIZED",
			message: "no session",
		});
		const next = vi.fn(async () => errorResult(error));
		const result = await auditMiddleware({
			ctx: buildCtx(),
			type: "query",
			path: "cseOpinion.getFiles",
			getRawInput: buildGetRawInput(undefined),
			next,
		});

		expect(result).toEqual(errorResult(error));
		expect(mockLogAction).not.toHaveBeenCalled();
		expect(mockEmitActivityLog.mock.calls[0]?.[0]).toMatchObject({
			action: null,
			status: "failure",
			errorCode: "UNAUTHORIZED",
		});
	});

	it("emits a failure stdout line and re-throws when an unmapped path's next() itself throws", async () => {
		const error = new TRPCError({
			code: "TIMEOUT",
			message: "upstream timed out",
		});
		const next = vi.fn(async () => {
			throw error;
		});

		await expect(
			auditMiddleware({
				ctx: buildCtx(),
				type: "query",
				path: "cseOpinion.getFiles",
				getRawInput: buildGetRawInput(undefined),
				next,
			}),
		).rejects.toBe(error);

		expect(mockLogAction).not.toHaveBeenCalled();
		expect(mockEmitActivityLog.mock.calls[0]?.[0]).toMatchObject({
			action: null,
			status: "failure",
			errorCode: "TIMEOUT",
		});
	});

	// S3 — a protected procedure called without a session: the guard's ok:false must be recorded, and handed back untouched.
	it("records an anonymous guard rejection on an unmapped path as a failure, without user identity", async () => {
		const error = new TRPCError({
			code: "UNAUTHORIZED",
			message: "no session",
		});
		const next = vi.fn(async () => errorResult(error));

		const result = await auditMiddleware({
			ctx: { session: null, headers: new Headers() },
			type: "query",
			path: "cseOpinion.getFiles",
			getRawInput: buildGetRawInput(undefined),
			next,
		});

		expect(result).toEqual(errorResult(error));
		expect(mockEmitActivityLog.mock.calls[0]?.[0]).toMatchObject({
			status: "failure",
			errorCode: "UNAUTHORIZED",
			userId: null,
			siren: null,
			ip: null,
		});
	});

	it("records an anonymous guard rejection on a mapped path as a failure, without user identity", async () => {
		const error = new TRPCError({
			code: "UNAUTHORIZED",
			message: "no session",
		});
		const next = vi.fn(async () => errorResult(error));

		const result = await auditMiddleware({
			ctx: { session: null, headers: new Headers() },
			type: "query",
			path: "profile.get",
			getRawInput: buildGetRawInput(undefined),
			next,
		});

		expect(result).toEqual(errorResult(error));
		expect(mockEmitActivityLog).not.toHaveBeenCalled();
		expect(mockLogAction.mock.calls[0]?.[0]).toMatchObject({
			action: "profile.read",
			status: "failure",
			errorMessage: "UNAUTHORIZED: no session",
			userId: null,
			userEmail: null,
			siren: null,
		});
	});

	it("treats an ok:false resolution as a failure even when its error is not a TRPCError", async () => {
		const next = vi.fn(async () => ({
			ok: false as const,
			error: new Error("unexpected shape"),
		}));

		await auditMiddleware({
			ctx: buildCtx(),
			type: "query",
			path: "cseOpinion.getFiles",
			getRawInput: buildGetRawInput(undefined),
			next,
		});

		expect(mockEmitActivityLog.mock.calls[0]?.[0]).toMatchObject({
			status: "failure",
			errorCode: "ERROR",
		});
	});

	it("still emits the unmapped stdout line when getRawInput throws", async () => {
		const next = vi.fn(async () => okResult("result"));

		await auditMiddleware({
			ctx: buildCtx(),
			type: "query",
			path: "cseOpinion.getFiles",
			getRawInput: async () => {
				throw new Error("input parse failed");
			},
			next,
		});

		expect(mockEmitActivityLog).toHaveBeenCalledOnce();
		expect(mockEmitActivityLog.mock.calls[0]?.[0]).toMatchObject({
			status: "success",
			rawInput: undefined,
		});
	});

	it("logs 'Unknown error' when a mapped path's next() throws something that is not an Error", async () => {
		const next = vi.fn(() => Promise.reject("not-an-error"));

		await expect(
			auditMiddleware({
				ctx: buildCtx(),
				type: "mutation",
				path: "declaration.submit",
				getRawInput: buildGetRawInput(undefined),
				next,
			}),
		).rejects.toBe("not-an-error");

		expect(mockLogAction.mock.calls[0]?.[0]).toMatchObject({
			status: "failure",
			errorMessage: "Unknown error",
		});
	});

	it("emits errorCode ERROR for an unmapped path when next() throws a non-TRPCError", async () => {
		const next = vi.fn(async () => {
			throw new Error("boom");
		});

		await expect(
			auditMiddleware({
				ctx: buildCtx(),
				type: "query",
				path: "cseOpinion.getFiles",
				getRawInput: buildGetRawInput(undefined),
				next,
			}),
		).rejects.toThrow("boom");

		expect(mockEmitActivityLog.mock.calls[0]?.[0]).toMatchObject({
			status: "failure",
			errorCode: "ERROR",
		});
	});

	it("logs a successful mutation with user, siren, IP and metadata", async () => {
		const next = vi.fn(async () => okResult({ success: true }));
		await auditMiddleware({
			ctx: buildCtx(),
			type: "mutation",
			path: "declaration.submit",
			getRawInput: buildGetRawInput({ year: 2026, totalWomen: 10 }),
			next,
		});

		expect(mockLogAction).toHaveBeenCalledOnce();
		expect(mockLogAction.mock.calls[0]?.[0]).toMatchObject({
			action: "declaration.submit",
			status: "success",
			userId: "user-1",
			userEmail: "user@example.com",
			siren: "123456789",
			ipAddress: "203.0.113.10",
			userAgent: "TestAgent",
			metadata: { year: 2026, totalWomen: 10 },
			origin: {
				source: "trpc",
				route: "declaration.submit",
				operation: "mutation",
			},
		});
	});

	it("logs the admin lock-timeout update mutation", async () => {
		const next = vi.fn(async () => okResult({ success: true }));
		await auditMiddleware({
			ctx: buildCtx(),
			type: "mutation",
			path: "adminSettings.updateLockTimeout",
			getRawInput: buildGetRawInput({ timeoutMinutes: 45 }),
			next,
		});

		expect(mockLogAction.mock.calls[0]?.[0]).toMatchObject({
			action: "admin_settings.update_lock_timeout",
			status: "success",
			metadata: { timeoutMinutes: 45 },
		});
	});

	it("logs the representation campaign upsert mutation", async () => {
		const next = vi.fn(async () => okResult({ success: true }));
		await auditMiddleware({
			ctx: buildCtx(),
			type: "mutation",
			path: "adminSettings.upsertRepresentationCampaign",
			getRawInput: buildGetRawInput({
				year: 2026,
				campaignStartDate: "2026-02-01",
				campaignEndDate: "2026-11-30",
				declarationDeadline: "2026-04-15",
			}),
			next,
		});

		expect(mockLogAction.mock.calls[0]?.[0]).toMatchObject({
			action: "admin_settings.upsert_representation_campaign",
			status: "success",
			metadata: { year: 2026, campaignStartDate: "2026-02-01" },
		});
	});

	it("logs the representation campaign read as an opt-in sensitive query", async () => {
		const next = vi.fn(async () => okResult({ year: 2026, isDefault: true }));
		await auditMiddleware({
			ctx: buildCtx(),
			type: "query",
			path: "adminSettings.getRepresentationCampaignByYear",
			getRawInput: buildGetRawInput({ year: 2026 }),
			next,
		});

		expect(mockLogAction.mock.calls[0]?.[0]).toMatchObject({
			action: "admin_settings.get_representation_campaign",
			status: "success",
			metadata: { year: 2026 },
		});
	});

	it("logs a failed mutation with the error message and re-throws when next() itself throws", async () => {
		const error = new TRPCError({
			code: "BAD_REQUEST",
			message: "Invalid input",
		});
		const next = vi.fn(async () => {
			throw error;
		});

		await expect(
			auditMiddleware({
				ctx: buildCtx(),
				type: "mutation",
				path: "declaration.submit",
				getRawInput: buildGetRawInput(undefined),
				next,
			}),
		).rejects.toBe(error);

		expect(mockLogAction.mock.calls[0]?.[0]).toMatchObject({
			action: "declaration.submit",
			status: "failure",
			errorMessage: "BAD_REQUEST: Invalid input",
		});
	});

	// tRPC v11's `next()` does not throw for a downstream failure (guard,
	// validation, resolver) — it resolves `{ ok: false, error }`. Before #3705
	// this branch was read as a success: every rejected mutation landed in the
	// DB as `status: success`. This is the regression test for that fix.
	it("treats an ok:false resolution as a failure, without altering the returned result", async () => {
		const error = new TRPCError({
			code: "UNAUTHORIZED",
			message: "no session",
		});
		const next = vi.fn(async () => errorResult(error));

		const result = await auditMiddleware({
			ctx: buildCtx(),
			type: "mutation",
			path: "declaration.submit",
			getRawInput: buildGetRawInput(undefined),
			next,
		});

		expect(result).toEqual(errorResult(error));
		expect(mockLogAction.mock.calls[0]?.[0]).toMatchObject({
			action: "declaration.submit",
			status: "failure",
			errorMessage: "UNAUTHORIZED: no session",
			origin: {
				source: "trpc",
				route: "declaration.submit",
				operation: "mutation",
			},
		});
	});

	it("logs the admin lock release mutation (adminDeclarations.releaseLock)", async () => {
		const next = vi.fn(async () => okResult({ declarationId: "decl-1" }));
		await auditMiddleware({
			ctx: buildCtx(),
			type: "mutation",
			path: "adminDeclarations.releaseLock",
			getRawInput: buildGetRawInput({ declarationId: "decl-1" }),
			next,
		});

		expect(mockLogAction.mock.calls[0]?.[0]).toMatchObject({
			action: "admin_declaration.release_lock",
			status: "success",
			metadata: { declarationId: "decl-1" },
		});
	});

	it("logs the profile update mutation (profile.updateProfile)", async () => {
		const next = vi.fn(async () => okResult({ success: true }));
		await auditMiddleware({
			ctx: buildCtx(),
			type: "mutation",
			path: "profile.updateProfile",
			getRawInput: buildGetRawInput({
				firstName: "Julien",
				lastName: "Martin",
				phone: "+33122334455",
			}),
			next,
		});

		expect(mockLogAction.mock.calls[0]?.[0]).toMatchObject({
			action: "profile.update",
			status: "success",
		});
	});

	it("keeps the phone-only profile mutation on its own action key", async () => {
		const next = vi.fn(async () => okResult({ success: true }));
		await auditMiddleware({
			ctx: buildCtx(),
			type: "mutation",
			path: "profile.updatePhone",
			getRawInput: buildGetRawInput({ phone: "+33122334455" }),
			next,
		});

		expect(mockLogAction.mock.calls[0]?.[0]).toMatchObject({
			action: "profile.update_phone",
			status: "success",
		});
	});

	it("logs sensitive query reads (declaration.getOrCreate)", async () => {
		const next = vi.fn(async () => okResult({ declaration: {} }));
		await auditMiddleware({
			ctx: buildCtx(),
			type: "query",
			path: "declaration.getOrCreate",
			getRawInput: buildGetRawInput(undefined),
			next,
		});

		expect(mockLogAction.mock.calls[0]?.[0]).toMatchObject({
			action: "declaration.read_gip_data",
			status: "success",
		});
	});

	it("logs the declaration lock state read (declarationLock.getActiveLockForCurrentDeclaration)", async () => {
		const next = vi.fn(async () =>
			okResult({ lockedByOther: true, holder: {} }),
		);
		await auditMiddleware({
			ctx: buildCtx(),
			type: "query",
			path: "declarationLock.getActiveLockForCurrentDeclaration",
			getRawInput: buildGetRawInput(undefined),
			next,
		});

		expect(mockLogAction.mock.calls[0]?.[0]).toMatchObject({
			action: "declaration.lock_state_read",
			status: "success",
		});
	});

	it("strips sensitive metadata keys (token, password, …)", async () => {
		const next = vi.fn(async () => okResult(undefined));
		await auditMiddleware({
			ctx: buildCtx(),
			type: "mutation",
			path: "profile.updatePhone",
			getRawInput: buildGetRawInput({
				phone: "0612345678",
				token: "secret-jwt",
				password: "x",
			}),
			next,
		});

		const metadata = mockLogAction.mock.calls[0]?.[0]?.metadata;
		expect(metadata).toEqual({ phone: "0612345678" });
	});

	it("strips sensitive keys from nested objects and arrays", async () => {
		const next = vi.fn(async () => okResult(undefined));
		await auditMiddleware({
			ctx: buildCtx(),
			type: "mutation",
			path: "profile.updatePhone",
			getRawInput: buildGetRawInput({
				phone: "0612345678",
				credentials: { token: "leak", expiresIn: 3600 },
				items: [
					{ name: "ok", apiKey: "leak" },
					{ name: "ok2", secret: "leak" },
				],
			}),
			next,
		});

		const metadata = mockLogAction.mock.calls[0]?.[0]?.metadata;
		expect(metadata).toEqual({
			phone: "0612345678",
			credentials: { expiresIn: 3600 },
			items: [{ name: "ok" }, { name: "ok2" }],
		});
	});

	// audit-logging.md forbids duplicating PII that is not already carried by
	// user_email or siren — the identity of a profile update must never reach
	// the 365-day `mutation` retention bucket.
	it("strips the identity PII of a profile update and keeps the rest", async () => {
		const next = vi.fn(async () => okResult({ success: true }));
		await auditMiddleware({
			ctx: buildCtx(),
			type: "mutation",
			path: "profile.updateProfile",
			getRawInput: buildGetRawInput({
				firstName: "Julien",
				lastName: "Martin",
				phone: "+33122334455",
			}),
			next,
		});

		expect(mockLogAction.mock.calls[0]?.[0]?.metadata).toEqual({
			phone: "+33122334455",
		});
	});

	it("strips the identity keys whatever their casing", async () => {
		const next = vi.fn(async () => okResult({ success: true }));
		await auditMiddleware({
			ctx: buildCtx(),
			type: "mutation",
			path: "profile.updateProfile",
			getRawInput: buildGetRawInput({
				FirstName: "Julien",
				LASTNAME: "Martin",
				phone: "+33122334455",
			}),
			next,
		});

		expect(mockLogAction.mock.calls[0]?.[0]?.metadata).toEqual({
			phone: "+33122334455",
		});
	});

	it("keeps null values, drops undefined fields and preserves array positions in metadata", async () => {
		const next = vi.fn(async () => okResult(undefined));
		await auditMiddleware({
			ctx: buildCtx(),
			type: "mutation",
			path: "profile.updatePhone",
			getRawInput: buildGetRawInput({
				phone: "0612345678",
				extension: null,
				skipped: undefined,
				items: [undefined, 1],
			}),
			next,
		});

		expect(mockLogAction.mock.calls[0]?.[0]?.metadata).toStrictEqual({
			phone: "0612345678",
			extension: null,
			items: [undefined, 1],
		});
	});

	it("logs a null metadata rather than an empty object when every key is stripped", async () => {
		const next = vi.fn(async () => okResult({ success: true }));
		await auditMiddleware({
			ctx: buildCtx(),
			type: "mutation",
			path: "profile.updateProfile",
			getRawInput: buildGetRawInput({
				firstName: "Julien",
				lastName: "Martin",
			}),
			next,
		});

		expect(mockLogAction.mock.calls[0]?.[0]).toMatchObject({
			action: "profile.update",
			status: "success",
		});
		expect(mockLogAction.mock.calls[0]?.[0]?.metadata).toBeNull();
	});

	// The allowlist keeps declaration content (percentages, free text) out of audit.action_log.
	it.each([
		"representationDeclaration.get",
		"representationDeclaration.saveDraft",
		"representationDeclaration.submit",
		"representationDeclaration.declareNotSubject",
	])("keeps only the allowlisted keys in metadata for %s", async (path) => {
		const next = vi.fn(async () => okResult(undefined));
		await auditMiddleware({
			ctx: buildCtx(),
			type: "mutation",
			path,
			getRawInput: buildGetRawInput({
				year: 2025,
				executiveWomenPercent: 60,
				publishModalities: "Affichage dans les locaux et note de service.",
			}),
			next,
		});

		expect(mockLogAction.mock.calls[0]?.[0]?.metadata).toEqual({ year: 2025 });
	});

	it("logs the not-subject choice under its own action key", async () => {
		const next = vi.fn(async () => okResult({ success: true }));
		await auditMiddleware({
			ctx: buildCtx(),
			type: "mutation",
			path: "representationDeclaration.declareNotSubject",
			getRawInput: buildGetRawInput({ year: 2026 }),
			next,
		});

		expect(mockLogAction.mock.calls[0]?.[0]).toMatchObject({
			action: "representation_declaration.declare_not_subject",
			status: "success",
			siren: "123456789",
			metadata: { year: 2026 },
		});
	});

	it("returns null metadata when an allowlisted path carries none of its allowed keys", async () => {
		const next = vi.fn(async () => okResult(undefined));
		await auditMiddleware({
			ctx: buildCtx(),
			type: "mutation",
			path: "representationDeclaration.submit",
			getRawInput: buildGetRawInput({ executiveWomenPercent: 60 }),
			next,
		});

		expect(mockLogAction.mock.calls[0]?.[0]?.metadata).toBeNull();
	});

	it("wraps a non-object input into a value field instead of applying the allowlist", async () => {
		const next = vi.fn(async () => okResult(undefined));
		await auditMiddleware({
			ctx: buildCtx(),
			type: "query",
			path: "representationDeclaration.get",
			getRawInput: buildGetRawInput(2025),
			next,
		});

		expect(mockLogAction.mock.calls[0]?.[0]?.metadata).toEqual({ value: 2025 });
	});

	it("returns null metadata when input is empty", async () => {
		const next = vi.fn(async () => okResult(undefined));
		await auditMiddleware({
			ctx: buildCtx(),
			type: "mutation",
			path: "declaration.submit",
			getRawInput: buildGetRawInput(undefined),
			next,
		});
		expect(mockLogAction.mock.calls[0]?.[0]?.metadata).toBeNull();
	});

	it("handles sessions with no siret gracefully", async () => {
		const next = vi.fn(async () => okResult(undefined));
		await auditMiddleware({
			ctx: buildCtx(null),
			type: "query",
			path: "profile.get",
			getRawInput: buildGetRawInput(undefined),
			next,
		});
		expect(mockLogAction.mock.calls[0]?.[0]?.siren).toBeNull();
	});

	it("swallows getRawInput errors and still logs the action", async () => {
		const next = vi.fn(async () => okResult(undefined));
		await auditMiddleware({
			ctx: buildCtx(),
			type: "mutation",
			path: "declaration.submit",
			getRawInput: async () => {
				throw new Error("input parse failed");
			},
			next,
		});
		expect(mockLogAction).toHaveBeenCalledOnce();
		expect(mockLogAction.mock.calls[0]?.[0]?.metadata).toBeNull();
	});
});
