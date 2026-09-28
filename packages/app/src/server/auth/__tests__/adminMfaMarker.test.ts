import type { Account, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFindFirst = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();

vi.mock("~/server/db", () => ({
	db: {
		query: {
			users: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
		},
		insert: (...args: unknown[]) => mockInsert(...args),
		update: (...args: unknown[]) =>
			mockUpdate(...args) ?? {
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(undefined),
				}),
			},
		transaction: vi.fn(),
	},
}));
vi.mock("~/server/db/schema", () => ({
	users: { email: "email", id: "id" },
	companies: { siren: "siren" },
	userCompanies: {},
	// The sign-in branch closes any open impersonation row (#4466), so the
	// schema mock has to carry the table it targets.
	adminImpersonationEvents: {
		adminUserId: "adminUserId",
		stoppedAt: "stoppedAt",
	},
}));
vi.mock("~/server/services/weez", () => ({
	fetchCompanyBySiren: vi.fn(),
}));

const mockLogAction = vi.fn();
vi.mock("~/server/audit/log", () => ({
	logAction: (...args: unknown[]) => mockLogAction(...args),
}));

import { authConfig } from "../config";

const { callbacks } = authConfig;

const DECLARANT_EMAIL = "declarant@example.fr";

// NextAuth callback types are stricter than runtime behavior — cast via unknown.
function callJwt(params: Record<string, unknown>) {
	return callbacks.jwt(
		params as unknown as Parameters<typeof callbacks.jwt>[0],
	);
}

describe("auth config — admin two-factor authentication", () => {
	beforeEach(() => {
		mockFindFirst.mockReset();
		mockInsert.mockReset();
		mockUpdate.mockReset();
		mockLogAction.mockReset();
	});

	describe("jwt callback — admin two-factor marker", () => {
		const ADMIN_EMAIL = "agent@example.fr";
		const AUTH_TIME = 1_772_000_000;

		/** A ProConnect id_token carrying the given claims, signature aside. */
		function idToken(claims: Record<string, unknown>) {
			const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
			return `header.${payload}.signature`;
		}

		function signInWith(
			claims: Record<string, unknown> | null,
			email = DECLARANT_EMAIL,
		) {
			mockFindFirst.mockResolvedValue({
				id: "uuid-123",
				phone: null,
				firstName: "Alice",
				lastName: "Martin",
				isAdmin: false,
			});
			return callJwt({
				token: { sub: "sub-123" } as JWT,
				user: { id: "proconnect-sub", email } as User,
				account: (claims
					? { id_token: idToken(claims) }
					: {}) as unknown as Account,
				trigger: "signIn",
			});
		}

		it("dates the session with auth_time when ProConnect reports a second factor", async () => {
			const result = await signInWith({
				acr: "eidas1-mfa",
				auth_time: AUTH_TIME,
			});

			expect(result.adminMfaAt).toBe(AUTH_TIME);
		});

		it("falls back to the server clock when the accepted level carries no auth_time", async () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date("2026-03-10T08:00:00.000Z"));
			try {
				const result = await signInWith({ acr: "eidas1-mfa" });

				expect(result.adminMfaAt).toBe(
					Math.floor(Date.parse("2026-03-10T08:00:00.000Z") / 1000),
				);
			} finally {
				vi.useRealTimers();
			}
		});

		it.each([
			["a non-numeric auth_time", "1772000000"],
			["an auth_time of zero", 0],
			["a negative auth_time", -1],
		])("ignores %s and dates from the server clock", async (_label, authTime) => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date("2026-03-10T08:00:00.000Z"));
			try {
				const result = await signInWith({
					acr: "eidas1-mfa",
					auth_time: authTime,
				});

				expect(result.adminMfaAt).toBe(
					Math.floor(Date.parse("2026-03-10T08:00:00.000Z") / 1000),
				);
			} finally {
				vi.useRealTimers();
			}
		});

		it("truncates a fractional auth_time to whole seconds", async () => {
			const result = await signInWith({
				acr: "eidas1-mfa",
				auth_time: AUTH_TIME + 0.75,
			});

			expect(result.adminMfaAt).toBe(AUTH_TIME);
		});

		it.each([
			"eidas1",
			"eidas2",
			"eidas3",
		])("signs the user in and leaves the session undated for %s", async (acr) => {
			const result = await signInWith({ acr, auth_time: AUTH_TIME });

			expect(result.id).toBe("uuid-123");
			expect(result.adminMfaAt).toBeUndefined();
		});

		it.each([
			["the id_token carries no acr", { auth_time: AUTH_TIME }],
			["acr is not a string", { acr: 1, auth_time: AUTH_TIME }],
		])("leaves the session undated when %s", async (_label, claims) => {
			const result = await signInWith(claims);

			expect(result.adminMfaAt).toBeUndefined();
		});

		it("leaves the session undated when the account carries no id_token", async () => {
			const result = await signInWith(null);

			expect(result.adminMfaAt).toBeUndefined();
		});

		it.each([
			["is not a JWT at all", "not-a-jwt"],
			["has an undecodable payload", "header..signature"],
			["has a payload that is not JSON", "header.bm90LWpzb24.signature"],
		])("leaves the session undated when the id_token %s", async (_label, raw) => {
			mockFindFirst.mockResolvedValue({
				id: "uuid-123",
				phone: null,
				isAdmin: false,
			});

			const result = await callJwt({
				token: { sub: "sub-123" } as JWT,
				user: { id: "proconnect-sub", email: DECLARANT_EMAIL } as User,
				account: { id_token: raw } as unknown as Account,
				trigger: "signIn",
			});

			expect(result.adminMfaAt).toBeUndefined();
		});

		it("records the two-factor passage of an admin account", async () => {
			await signInWith(
				{ acr: "eidas1-mfa", auth_time: AUTH_TIME },
				ADMIN_EMAIL,
			);

			expect(mockLogAction).toHaveBeenCalledWith(
				expect.objectContaining({
					action: "auth.admin_mfa",
					status: "success",
					userId: "uuid-123",
					userEmail: ADMIN_EMAIL,
					metadata: { acr: "eidas1-mfa", authTime: AUTH_TIME },
				}),
			);
		});

		it("still records success when the level of an admin account carries no second factor — the sign-in itself did not fail", async () => {
			await signInWith({ acr: "eidas1", auth_time: AUTH_TIME }, ADMIN_EMAIL);

			expect(mockLogAction).toHaveBeenCalledWith(
				expect.objectContaining({
					action: "auth.admin_mfa",
					status: "success",
					metadata: { acr: "eidas1", authTime: null },
				}),
			);
		});

		it("logs the level and the instant, never the token nor the raw claims", async () => {
			await signInWith(
				{ acr: "eidas1-mfa", auth_time: AUTH_TIME, sub: "proconnect-sub" },
				ADMIN_EMAIL,
			);

			const [entry] = mockLogAction.mock.calls[0] as [
				{ metadata: Record<string, unknown> },
			];
			expect(Object.keys(entry.metadata).sort()).toEqual(["acr", "authTime"]);
			expect(JSON.stringify(entry)).not.toContain("header.");
		});

		it("attaches the request context to the audit row, as the other auth events do", async () => {
			await signInWith(
				{ acr: "eidas1-mfa", auth_time: AUTH_TIME },
				ADMIN_EMAIL,
			);

			const [entry] = mockLogAction.mock.calls[0] as [Record<string, unknown>];
			expect(entry).toHaveProperty("ipAddress");
			expect(entry).toHaveProperty("userAgent");
		});

		it("does not open an admin audit trail for a declarant sign-in", async () => {
			await signInWith({ acr: "eidas1-mfa", auth_time: AUTH_TIME });

			expect(mockLogAction).not.toHaveBeenCalled();
		});
	});

	describe("jwt callback — adminMfaAt is not client-writable", () => {
		it("ignores an adminMfaAt pushed through a client session update", async () => {
			const result = await callJwt({
				token: { sub: "sub-123", id: "uuid-123", isAdmin: true } as JWT,
				trigger: "update",
				session: { adminMfaAt: 9_999_999_999 },
			});

			expect(result.adminMfaAt).toBeUndefined();
		});

		it("never lets a session update refresh a marker already on the token", async () => {
			const result = await callJwt({
				token: {
					sub: "sub-123",
					id: "uuid-123",
					isAdmin: true,
					adminMfaAt: 1_772_000_000,
				} as JWT,
				trigger: "update",
				session: { adminMfaAt: 9_999_999_999 },
			});

			expect(result.adminMfaAt).toBe(1_772_000_000);
		});

		it("ignores an adminMfaAt pushed by a non-admin session update", async () => {
			const result = await callJwt({
				token: { sub: "sub-123", id: "uuid-123", isAdmin: false } as JWT,
				trigger: "update",
				session: { adminMfaAt: 9_999_999_999 },
			});

			expect(result.adminMfaAt).toBeUndefined();
		});
	});

	describe("proconnect authorization request", () => {
		function proconnectProvider() {
			return authConfig.providers.find(
				(provider) => (provider as { id?: string }).id === "proconnect",
			) as { authorization: { params: Record<string, unknown> } };
		}

		it("asks for the declarant scopes and nothing more", () => {
			expect(proconnectProvider().authorization.params).toEqual({
				scope: "openid email given_name usual_name siret",
			});
		});

		it.each([
			"claims",
			"max_age",
			"acr_values",
		])("never carries %s on the declarant journey", (param) => {
			expect(proconnectProvider().authorization.params).not.toHaveProperty(
				param,
			);
		});
	});
});
