import type { Account, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockEnv, mockHeaders } = vi.hoisted(() => ({
	mockEnv: {
		ADMIN_EMAILS: "agent@example.fr",
		EGAPRO_E2E_ADMIN_MFA: false as boolean,
		EGAPRO_DEV_AUTH: false as boolean,
		NODE_ENV: "production" as "development" | "test" | "production",
	},
	mockHeaders: { current: null as Headers | null },
}));

vi.mock("~/env", () => ({ env: mockEnv }));
vi.mock("next/headers", () => ({
	headers: async () => {
		if (!mockHeaders.current) throw new Error("outside a request scope");
		return mockHeaders.current;
	},
}));

const mockFindFirst = vi.fn();
vi.mock("~/server/db", () => ({
	db: {
		query: {
			users: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
		},
		insert: vi.fn(),
		update: vi.fn().mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue(undefined),
			}),
		}),
		transaction: vi.fn(),
	},
}));
vi.mock("~/server/db/schema", () => ({
	users: { email: "email", id: "id" },
	companies: { siren: "siren" },
	userCompanies: {},
	adminImpersonationEvents: {},
}));
vi.mock("~/server/services/weez", () => ({ fetchCompanyBySiren: vi.fn() }));

const mockLogAction = vi.fn();
vi.mock("~/server/audit/log", () => ({
	logAction: (...args: unknown[]) => mockLogAction(...args),
}));

import { authConfig } from "../config";

const { callbacks } = authConfig;

const ADMIN_EMAIL = "agent@example.fr";
const DECLARANT_EMAIL = "declarant@example.fr";
const NOW_ISO = "2026-03-10T08:00:00.000Z";
const NOW_SECONDS = Math.floor(Date.parse(NOW_ISO) / 1000);

/** A ProConnect id_token carrying the given claims, signature aside. */
function idToken(claims: Record<string, unknown>) {
	const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
	return `header.${payload}.signature`;
}

/**
 * Drive one sign-in through the `jwt` callback. `request` describes what the
 * server saw of the incoming request: `null` means no request scope at all.
 */
async function signIn({
	email = ADMIN_EMAIL,
	claims = { acr: "eidas1", auth_time: 1_772_000_000 } as Record<
		string,
		unknown
	> | null,
	request = { host: "localhost:3000" } as Record<string, string> | null,
}: {
	email?: string;
	claims?: Record<string, unknown> | null;
	request?: Record<string, string> | null;
} = {}) {
	mockFindFirst.mockResolvedValue({
		id: "uuid-123",
		phone: null,
		firstName: "Alice",
		lastName: "Martin",
		isAdmin: false,
	});
	mockHeaders.current = request ? new Headers(request) : null;

	vi.useFakeTimers();
	vi.setSystemTime(new Date(NOW_ISO));
	try {
		return await callbacks.jwt({
			token: { sub: "sub-123" } as JWT,
			user: { id: "proconnect-sub", email } as User,
			account: (claims
				? { id_token: idToken(claims) }
				: {}) as unknown as Account,
			trigger: "signIn",
		} as unknown as Parameters<typeof callbacks.jwt>[0]);
	} finally {
		vi.useRealTimers();
	}
}

describe("auth config — E2E admin two-factor seam", () => {
	beforeEach(() => {
		mockFindFirst.mockReset();
		mockLogAction.mockReset();
		mockEnv.EGAPRO_E2E_ADMIN_MFA = false;
		mockHeaders.current = null;
	});

	describe("the seam is inert unless both barriers are met", () => {
		it("leaves the session undated when the flag is off, even on a loopback host", async () => {
			const result = await signIn();

			expect(result.adminMfaAt).toBeUndefined();
		});

		it.each([
			["a deployed hostname", { host: "egapro.travail.gouv.fr" }],
			[
				"a review-app hostname",
				{ host: "app-egapro-alpha.dev.fabrique.social.gouv.fr" },
			],
			[
				"a hostname merely containing localhost",
				{ host: "localhost.attacker.example" },
			],
			["a hostname merely ending in localhost", { host: "notlocalhost" }],
			["no host header at all", {}],
		])("leaves the session undated with the flag on but %s", async (_label, request) => {
			mockEnv.EGAPRO_E2E_ADMIN_MFA = true;

			const result = await signIn({ request });

			expect(result.adminMfaAt).toBeUndefined();
		});

		it("leaves the session undated with the flag on but no request scope", async () => {
			mockEnv.EGAPRO_E2E_ADMIN_MFA = true;

			const result = await signIn({ request: null });

			expect(result.adminMfaAt).toBeUndefined();
		});

		it('treats the string "false" as off, the trap z.coerce.boolean() falls into', async () => {
			// `env.js` parses the flag as a literal string enum precisely so this
			// value cannot arrive here as `true`; the seam then compares strictly.
			mockEnv.EGAPRO_E2E_ADMIN_MFA = "false" as unknown as boolean;

			const result = await signIn();

			expect(result.adminMfaAt).toBeUndefined();
		});
	});

	describe("the seam cannot be switched on by the request", () => {
		it.each([
			[
				"a header asking for it",
				{ host: "egapro.travail.gouv.fr", "x-egapro-e2e-admin-mfa": "true" },
			],
			[
				"a forwarded loopback host",
				{
					host: "egapro.travail.gouv.fr",
					"x-forwarded-host": "localhost:3000",
				},
			],
		])("refuses %s", async (_label, request) => {
			mockEnv.EGAPRO_E2E_ADMIN_MFA = true;

			const result = await signIn({ request });

			expect(result.adminMfaAt).toBeUndefined();
		});

		it("ignores an adminMfaAt pushed through a client session update while the seam is on", async () => {
			mockEnv.EGAPRO_E2E_ADMIN_MFA = true;
			mockHeaders.current = new Headers({ host: "localhost:3000" });

			const result = await callbacks.jwt({
				token: { sub: "sub-123", id: "uuid-123", isAdmin: true } as JWT,
				trigger: "update",
				session: { adminMfaAt: 9_999_999_999 },
			} as unknown as Parameters<typeof callbacks.jwt>[0]);

			expect(result.adminMfaAt).toBeUndefined();
		});
	});

	describe("with both barriers met", () => {
		beforeEach(() => {
			mockEnv.EGAPRO_E2E_ADMIN_MFA = true;
		});

		it.each([
			["localhost:3000"],
			["127.0.0.1:3000"],
			["localhost"],
			["[::1]:3000"],
		])("dates the session from the server clock on %s", async (host) => {
			const result = await signIn({ request: { host } });

			expect(result.adminMfaAt).toBe(NOW_SECONDS);
		});

		it("stands in only for a level below MFA, never overriding a real auth_time", async () => {
			const result = await signIn({
				claims: { acr: "eidas1-mfa", auth_time: 1_772_000_000 },
			});

			expect(result.adminMfaAt).toBe(1_772_000_000);
		});

		it("dates a sign-in whose id_token carries no acr at all", async () => {
			const result = await signIn({ claims: null });

			expect(result.adminMfaAt).toBe(NOW_SECONDS);
		});

		it("grants no habilitation: an unlisted email stays a non-admin", async () => {
			const result = await signIn({ email: DECLARANT_EMAIL });

			expect(result.isAdmin).toBe(false);
			expect(mockLogAction).not.toHaveBeenCalled();
		});

		it("marks the audit row as a test seam rather than a real second factor", async () => {
			await signIn();

			expect(mockLogAction).toHaveBeenCalledWith(
				expect.objectContaining({
					action: "auth.admin_mfa",
					status: "success",
					metadata: { acr: "eidas1", authTime: NOW_SECONDS, testSeam: true },
				}),
			);
		});

		it("leaves the audit row unmarked when ProConnect really returned the level", async () => {
			await signIn({ claims: { acr: "eidas1-mfa", auth_time: 1_772_000_000 } });

			const [entry] = mockLogAction.mock.calls[0] as [
				{ metadata: Record<string, unknown> },
			];
			expect(Object.keys(entry.metadata).sort()).toEqual(["acr", "authTime"]);
		});
	});
});
