import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockLogAction = vi.fn();
vi.mock("../log", () => ({
	logAction: (...args: unknown[]) => mockLogAction(...args),
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

describe("auditMiddleware", () => {
	beforeEach(() => {
		mockLogAction.mockClear();
	});

	it("skips logging when the path is not in the action map", async () => {
		const next = vi.fn(async () => "result");
		const result = await auditMiddleware({
			ctx: buildCtx(),
			path: "company.list",
			getRawInput: buildGetRawInput(undefined),
			next,
		});

		expect(result).toBe("result");
		expect(next).toHaveBeenCalledOnce();
		expect(mockLogAction).not.toHaveBeenCalled();
	});

	it("logs a successful mutation with user, siren, IP and metadata", async () => {
		const next = vi.fn(async () => ({ success: true }));
		await auditMiddleware({
			ctx: buildCtx(),
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
		});
	});

	it("logs the admin lock-timeout update mutation", async () => {
		const next = vi.fn(async () => ({ success: true }));
		await auditMiddleware({
			ctx: buildCtx(),
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

	it("logs a failed mutation with the error message and re-throws", async () => {
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

	it("logs the admin lock release mutation (adminDeclarations.releaseLock)", async () => {
		const next = vi.fn(async () => ({ declarationId: "decl-1" }));
		await auditMiddleware({
			ctx: buildCtx(),
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
		const next = vi.fn(async () => ({ success: true }));
		await auditMiddleware({
			ctx: buildCtx(),
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
		const next = vi.fn(async () => ({ success: true }));
		await auditMiddleware({
			ctx: buildCtx(),
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
		const next = vi.fn(async () => ({ declaration: {} }));
		await auditMiddleware({
			ctx: buildCtx(),
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
		const next = vi.fn(async () => ({ lockedByOther: true, holder: {} }));
		await auditMiddleware({
			ctx: buildCtx(),
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
		const next = vi.fn(async () => undefined);
		await auditMiddleware({
			ctx: buildCtx(),
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
		const next = vi.fn(async () => undefined);
		await auditMiddleware({
			ctx: buildCtx(),
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
		const next = vi.fn(async () => ({ success: true }));
		await auditMiddleware({
			ctx: buildCtx(),
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
		const next = vi.fn(async () => ({ success: true }));
		await auditMiddleware({
			ctx: buildCtx(),
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

	it("logs a null metadata rather than an empty object when every key is stripped", async () => {
		const next = vi.fn(async () => ({ success: true }));
		await auditMiddleware({
			ctx: buildCtx(),
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

	it("returns null metadata when input is empty", async () => {
		const next = vi.fn(async () => undefined);
		await auditMiddleware({
			ctx: buildCtx(),
			path: "declaration.submit",
			getRawInput: buildGetRawInput(undefined),
			next,
		});
		expect(mockLogAction.mock.calls[0]?.[0]?.metadata).toBeNull();
	});

	it("handles sessions with no siret gracefully", async () => {
		const next = vi.fn(async () => undefined);
		await auditMiddleware({
			ctx: buildCtx(null),
			path: "profile.get",
			getRawInput: buildGetRawInput(undefined),
			next,
		});
		expect(mockLogAction.mock.calls[0]?.[0]?.siren).toBeNull();
	});

	it("swallows getRawInput errors and still logs the action", async () => {
		const next = vi.fn(async () => undefined);
		await auditMiddleware({
			ctx: buildCtx(),
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
