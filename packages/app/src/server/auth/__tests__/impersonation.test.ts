import type { JWT } from "next-auth/jwt";
import { describe, expect, it, vi } from "vitest";

// The impersonation-update branch of the jwt callback writes to the audit
// log inside a transaction. Factory returns self-contained stubs.
vi.mock("~/server/db", () => {
	const chain = () => ({
		values: () => ({
			onConflictDoNothing: () => Promise.resolve(),
		}),
	});
	const plainValues = () => ({ values: () => Promise.resolve() });
	const setWhere = () => ({
		set: () => ({ where: () => Promise.resolve() }),
	});
	return {
		db: {
			transaction: async (fn: (tx: unknown) => unknown) =>
				fn({
					insert: (() => {
						let first = true;
						return () => {
							if (first) {
								first = false;
								return chain();
							}
							return plainValues();
						};
					})(),
					update: () => setWhere(),
				}),
			update: () => setWhere(),
		},
	};
});
vi.mock("~/server/db/schema", () => ({
	users: {},
	companies: { siren: "siren" },
	userCompanies: {},
	adminImpersonationEvents: {
		adminUserId: "adminUserId",
		stoppedAt: "stoppedAt",
	},
}));
vi.mock("~/server/services/weez", () => ({
	fetchCompanyBySiren: vi.fn(),
}));

import { authConfig } from "../config";

const { callbacks } = authConfig;

function callJwt(params: Record<string, unknown>) {
	return callbacks.jwt(
		params as unknown as Parameters<typeof callbacks.jwt>[0],
	);
}

function callSession(params: Record<string, unknown>) {
	return callbacks.session(
		params as unknown as Parameters<typeof callbacks.session>[0],
	);
}

describe("jwt callback — impersonation update trigger", () => {
	it("writes impersonation into the token when admin updates the session", async () => {
		const token = { id: "u1", isAdmin: true } as JWT;
		const result = await callJwt({
			token,
			trigger: "update",
			session: { impersonation: { siren: "123456789", name: "Acme" } },
		});
		expect(result.impersonation).toEqual({
			siren: "123456789",
			name: "Acme",
		});
	});

	it("clears impersonation when the update payload is null", async () => {
		const token = {
			id: "u1",
			isAdmin: true,
			impersonation: { siren: "123456789", name: "Acme" },
		} as JWT;
		const result = await callJwt({
			token,
			trigger: "update",
			session: { impersonation: null },
		});
		expect(result.impersonation).toBeNull();
	});

	it("ignores impersonation update from a non-admin token", async () => {
		const token = { id: "u1", isAdmin: false } as JWT;
		const result = await callJwt({
			token,
			trigger: "update",
			session: { impersonation: { siren: "123456789", name: "Acme" } },
		});
		expect(result.impersonation).toBeUndefined();
	});

	it("rejects malformed impersonation payloads (invalid SIREN)", async () => {
		const token = { id: "u1", isAdmin: true } as JWT;
		const result = await callJwt({
			token,
			trigger: "update",
			session: { impersonation: { siren: "abc", name: "Acme" } },
		});
		expect(result.impersonation).toBeUndefined();
	});

	it("rejects payload missing the `name` field", async () => {
		const token = { id: "u1", isAdmin: true } as JWT;
		const result = await callJwt({
			token,
			trigger: "update",
			session: { impersonation: { siren: "123456789" } },
		});
		expect(result.impersonation).toBeUndefined();
	});
});

describe("session callback — impersonation propagation", () => {
	it("mirrors token.impersonation onto session.user.impersonation", () => {
		const result = callSession({
			session: { user: { name: null, email: null, image: null }, expires: "" },
			token: {
				id: "u1",
				isAdmin: true,
				impersonation: { siren: "123456789", name: "Acme" },
			} as unknown as JWT,
		}) as {
			user: { impersonation: { siren: string; name: string } | null };
		};
		expect(result.user.impersonation).toEqual({
			siren: "123456789",
			name: "Acme",
		});
	});

	it("defaults impersonation to null when token has none", () => {
		const result = callSession({
			session: { user: { name: null, email: null, image: null }, expires: "" },
			token: { id: "u1", isAdmin: false } as unknown as JWT,
		}) as { user: { impersonation: unknown } };
		expect(result.user.impersonation).toBeNull();
	});
});
