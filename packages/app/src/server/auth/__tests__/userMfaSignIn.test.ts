import type { Account, User } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockEnv, mockHeaders } = vi.hoisted(() => ({
	mockEnv: {
		ADMIN_EMAILS: "[EMAIL_REDACTED]",
		EGAPRO_ADMIN_REQUIRE_PUBLIC_AGENT: true as boolean,
		EGAPRO_E2E_MFA: false as boolean,
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

vi.mock("~/server/db", () => ({
	db: {
		query: { users: { findFirst: vi.fn() } },
		insert: vi.fn(),
		update: vi.fn(),
		transaction: vi.fn(),
	},
}));
vi.mock("~/server/db/schema", () => ({
	users: { email: "email", id: "id" },
	companies: { siren: "siren" },
	userCompanies: {},
	adminImpersonationEvents: {},
}));
vi.mock("../companyLink", () => ({ syncUserCompanyLink: async () => [] }));
vi.mock("~/server/audit/log", () => ({ logAction: vi.fn() }));

import { authConfig } from "../config";

const signInCallback = authConfig.callbacks.signIn as (params: {
	user: User;
	account: Account;
}) => Promise<boolean | string>;

const DECLARANT_EMAIL = "[EMAIL_REDACTED]";

/** A ProConnect id_token carrying the given claims, signature aside. */
function idToken(claims: Record<string, unknown>) {
	const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
	return `header.${payload}.signature`;
}

async function signInWith({
	provider = "proconnect",
	claims = { acr: "eidas0-mfa" } as Record<string, unknown> | null,
	request = null as Record<string, string> | null,
}: {
	provider?: string;
	claims?: Record<string, unknown> | null;
	request?: Record<string, string> | null;
} = {}) {
	mockHeaders.current = request ? new Headers(request) : null;

	return signInCallback({
		user: { id: "proconnect-sub", email: DECLARANT_EMAIL } as User,
		account: {
			provider,
			...(claims ? { id_token: idToken(claims) } : {}),
		} as Account,
	});
}

describe("auth config — declarant MFA floor", () => {
	beforeEach(() => {
		mockEnv.EGAPRO_E2E_MFA = false;
		mockHeaders.current = null;
	});

	describe("server-side check of the returned acr", () => {
		it.each([
			"eidas0-mfa",
			"eidas1-mfa",
			"eidas2",
			"eidas3",
		])("opens a session when ProConnect reports %s", async (acr) => {
			await expect(signInWith({ claims: { acr } })).resolves.toBe(true);
		});

		it.each([
			"eidas0",
			"eidas1",
			"https://proconnect.gouv.fr/assurance/certification-dirigeant",
		])("refuses the session when ProConnect reports %s", async (acr) => {
			await expect(signInWith({ claims: { acr } })).resolves.toBe(false);
		});

		it("refuses the session when the id_token carries no acr", async () => {
			await expect(signInWith({ claims: {} })).resolves.toBe(false);
		});

		it("refuses the session when the account carries no id_token", async () => {
			await expect(signInWith({ claims: null })).resolves.toBe(false);
		});

		it("refuses the session when the id_token is not decodable", async () => {
			mockHeaders.current = null;

			await expect(
				signInCallback({
					user: { id: "proconnect-sub", email: DECLARANT_EMAIL } as User,
					account: {
						provider: "proconnect",
						id_token: "header..signature",
					} as Account,
				}),
			).resolves.toBe(false);
		});
	});

	describe("the local dev provider is exempt", () => {
		it("opens a session without any id_token", async () => {
			await expect(
				signInWith({ provider: "dev-auth", claims: null }),
			).resolves.toBe(true);
		});
	});

	describe("the E2E seam is inert unless both barriers are met", () => {
		it("refuses a low level when the flag is off, even on a loopback host", async () => {
			await expect(
				signInWith({
					claims: { acr: "eidas1" },
					request: { host: "localhost:3000" },
				}),
			).resolves.toBe(false);
		});

		it("opens a session on a loopback host when the flag is on", async () => {
			mockEnv.EGAPRO_E2E_MFA = true;

			await expect(
				signInWith({
					claims: { acr: "eidas1" },
					request: { host: "localhost:3000" },
				}),
			).resolves.toBe(true);
		});

		it("refuses a non-loopback host even when the flag is on", async () => {
			mockEnv.EGAPRO_E2E_MFA = true;

			await expect(
				signInWith({
					claims: { acr: "eidas1" },
					request: { host: "egapro.example.gouv.fr" },
				}),
			).resolves.toBe(false);
		});

		it("refuses outside a request scope even when the flag is on", async () => {
			mockEnv.EGAPRO_E2E_MFA = true;

			await expect(
				signInWith({ claims: { acr: "eidas1" }, request: null }),
			).resolves.toBe(false);
		});

		it("never accepts a string 'false' as the flag", async () => {
			mockEnv.EGAPRO_E2E_MFA = "false" as unknown as boolean;

			await expect(
				signInWith({
					claims: { acr: "eidas1" },
					request: { host: "localhost:3000" },
				}),
			).resolves.toBe(false);
		});
	});
});
