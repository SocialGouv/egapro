import type { Account, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockEnv } = vi.hoisted(() => ({
	mockEnv: {
		ADMIN_EMAILS: "agent@example.fr",
		EGAPRO_ADMIN_REQUIRE_PUBLIC_AGENT: true as boolean,
		EGAPRO_E2E_ADMIN_MFA: false as boolean,
		EGAPRO_DEV_AUTH: false as boolean,
		NODE_ENV: "production" as "development" | "test" | "production",
	},
}));

vi.mock("~/env", () => ({ env: mockEnv }));

const mockFindFirst = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();
vi.mock("~/server/db", () => ({
	db: {
		query: {
			users: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
		},
		insert: vi.fn(),
		update: (...args: unknown[]) => {
			mockUpdate(...args);
			return {
				set: (...setArgs: unknown[]) => {
					mockSet(...setArgs);
					return { where: vi.fn().mockResolvedValue(undefined) };
				},
			};
		},
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
const AUTH_TIME = 1_772_000_000;

/** A ProConnect id_token carrying the given claims, signature aside. */
function idToken(claims: Record<string, unknown>) {
	const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
	return `header.${payload}.signature`;
}

/** Drives one sign-in through the `jwt` callback with a given roles claim. */
async function signIn({
	email = ADMIN_EMAIL,
	roles,
	existingIsAdmin = false,
}: {
	email?: string;
	roles?: string[] | null;
	existingIsAdmin?: boolean;
}) {
	mockFindFirst.mockResolvedValue({
		id: "uuid-123",
		phone: null,
		firstName: "Alice",
		lastName: "Martin",
		isAdmin: existingIsAdmin,
	});

	return callbacks.jwt({
		token: { sub: "sub-123" } as JWT,
		user: { id: "proconnect-sub", email, roles } as User & {
			roles?: string[] | null;
		},
		account: {
			id_token: idToken({ acr: "eidas1-mfa", auth_time: AUTH_TIME }),
		} as Account,
		trigger: "signIn",
	} as unknown as Parameters<typeof callbacks.jwt>[0]);
}

describe("auth config — admin access grant (listed vs. public agent)", () => {
	beforeEach(() => {
		mockFindFirst.mockReset();
		mockUpdate.mockReset();
		mockSet.mockReset();
		mockLogAction.mockReset();
		mockEnv.EGAPRO_ADMIN_REQUIRE_PUBLIC_AGENT = true;
	});

	// S1
	it("grants isAdmin to a listed account whose roles contain agent_public", async () => {
		const result = await signIn({
			roles: ["agent_public", "agent_public_etat"],
		});

		expect(result.isAdmin).toBe(true);
	});

	// S2
	it("refuses a listed account whose roles are empty, and audits roles: []", async () => {
		const result = await signIn({ roles: [] });

		expect(result.isAdmin).toBe(false);
		expect(mockLogAction).toHaveBeenCalledWith(
			expect.objectContaining({
				metadata: expect.objectContaining({ roles: [] }),
			}),
		);
	});

	// S3
	it("refuses a listed account whose userinfo carries no roles claim, and audits roles: null", async () => {
		const result = await signIn({ roles: undefined });

		expect(result.isAdmin).toBe(false);
		expect(mockLogAction).toHaveBeenCalledWith(
			expect.objectContaining({
				metadata: expect.objectContaining({ roles: null }),
			}),
		);
	});

	// S4
	it("never grants an unlisted account, whatever roles ProConnect returns, and writes no audit row", async () => {
		const result = await signIn({
			email: DECLARANT_EMAIL,
			roles: ["agent_public"],
		});

		expect(result.isAdmin).toBe(false);
		expect(mockLogAction).not.toHaveBeenCalled();
	});

	// S5
	it("demotes a previously-admin account that is still listed but lost the public-agent role", async () => {
		const result = await signIn({ roles: [], existingIsAdmin: true });

		expect(result.isAdmin).toBe(false);
		expect(mockSet).toHaveBeenCalledWith({ isAdmin: false });
	});

	it("does not write to users.is_admin when the grant is unchanged", async () => {
		// db.update still fires once for the unconditional impersonation-row close.
		await signIn({ roles: ["agent_public"], existingIsAdmin: true });

		expect(mockSet).not.toHaveBeenCalledWith(
			expect.objectContaining({ isAdmin: expect.anything() }),
		);
	});

	// S8
	it("lifts only the public-agent requirement when the flag is false, leaving ADMIN_EMAILS authoritative", async () => {
		mockEnv.EGAPRO_ADMIN_REQUIRE_PUBLIC_AGENT = false;

		const result = await signIn({ roles: [] });

		expect(result.isAdmin).toBe(true);
		expect(mockLogAction).toHaveBeenCalledWith(
			expect.objectContaining({
				metadata: expect.objectContaining({
					roles: [],
					publicAgentRequired: false,
				}),
			}),
		);
	});

	it("still refuses an unlisted account when the flag is false", async () => {
		mockEnv.EGAPRO_ADMIN_REQUIRE_PUBLIC_AGENT = false;

		const result = await signIn({ email: DECLARANT_EMAIL, roles: [] });

		expect(result.isAdmin).toBe(false);
	});
});
