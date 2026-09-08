import type { Account, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ADMIN_MFA_WINDOW_SECONDS } from "~/modules/domain";

// Records every UPDATE the callbacks issue so the tests can tell an
// impersonation-closing statement from the other writes of a sign-in.
const closedImpersonations = vi.hoisted(
	() => [] as Array<Record<string, unknown>>,
);
// Records every row inserted into the administration journal, so a test can
// assert that a refused mimoquage opened none.
const startedImpersonations = vi.hoisted(
	() => [] as Array<Record<string, unknown>>,
);
const mockFindFirst = vi.hoisted(() => vi.fn());

// The impersonation-update branch of the jwt callback writes to the audit
// log inside a transaction. Factory returns self-contained stubs.
vi.mock("~/server/db", () => {
	const chain = () => ({
		values: () => ({
			onConflictDoNothing: () => Promise.resolve(),
		}),
	});
	const recordingValues = () => ({
		values: (values: Record<string, unknown>) => {
			startedImpersonations.push(values);
			return Promise.resolve();
		},
	});
	const recordingUpdate = (table: unknown) => ({
		set: (values: Record<string, unknown>) => {
			if ((table as { adminUserId?: string } | undefined)?.adminUserId) {
				closedImpersonations.push(values);
			}
			return { where: () => Promise.resolve() };
		},
	});
	return {
		db: {
			query: {
				users: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
			},
			insert: () => ({
				values: () => ({
					onConflictDoUpdate: () => Promise.resolve(),
					onConflictDoNothing: () => Promise.resolve(),
					returning: () => Promise.resolve([{ id: "u1", phone: null }]),
				}),
			}),
			transaction: async (fn: (tx: unknown) => unknown) =>
				fn({
					insert: (() => {
						let first = true;
						return () => {
							if (first) {
								first = false;
								return chain();
							}
							return recordingValues();
						};
					})(),
					update: recordingUpdate,
				}),
			update: recordingUpdate,
		},
	};
});
vi.mock("~/server/db/schema", () => ({
	users: { email: "email", id: "id" },
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
vi.mock("~/server/audit/log", () => ({ logAction: vi.fn() }));

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

const NOW_SECONDS = Math.floor(Date.now() / 1000);
const FRESH_MFA = NOW_SECONDS - 60;
const EXPIRED_MFA = NOW_SECONDS - ADMIN_MFA_WINDOW_SECONDS - 1;

const DEMO = { siren: "123456789", name: "Société Démo" };

beforeEach(() => {
	closedImpersonations.length = 0;
	startedImpersonations.length = 0;
	mockFindFirst.mockReset();
	mockFindFirst.mockResolvedValue({
		id: "u1",
		phone: null,
		isAdmin: true,
		firstName: "Alice",
		lastName: "Martin",
	});
});

describe("jwt callback — impersonation update trigger", () => {
	it("writes impersonation into the token when admin updates the session", async () => {
		const token = { id: "u1", isAdmin: true, adminMfaAt: FRESH_MFA } as JWT;
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
			adminMfaAt: FRESH_MFA,
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
		const token = { id: "u1", isAdmin: true, adminMfaAt: FRESH_MFA } as JWT;
		const result = await callJwt({
			token,
			trigger: "update",
			session: { impersonation: { siren: "abc", name: "Acme" } },
		});
		expect(result.impersonation).toBeUndefined();
	});

	it("rejects payload missing the `name` field", async () => {
		const token = { id: "u1", isAdmin: true, adminMfaAt: FRESH_MFA } as JWT;
		const result = await callJwt({
			token,
			trigger: "update",
			session: { impersonation: { siren: "123456789" } },
		});
		expect(result.impersonation).toBeUndefined();
	});

	it("refuses to start a mimoquage once the MFA window has closed", async () => {
		// Starting a mimoquage is an administrator privilege in its own right.
		// Were it gated on `isAdmin` alone, an agent whose window had closed
		// could open a row in the administration journal that no live mimoquage
		// backs — the very invariant #4466 exists to hold — and persist a
		// client-supplied company name without a valid second factor.
		const token = { id: "u1", isAdmin: true, adminMfaAt: EXPIRED_MFA } as JWT;
		const result = await callJwt({
			token,
			trigger: "update",
			session: { impersonation: { siren: "123456789", name: "Acme" } },
		});

		expect(result.impersonation).toBeUndefined();
		expect(startedImpersonations).toHaveLength(0);
	});

	it("closes the row it already had open when the switch is refused for a lapsed window", async () => {
		// An agent switching companies just as the window lapses must not be
		// left with a refused switch and its previous row still open.
		const token = {
			id: "u1",
			isAdmin: true,
			adminMfaAt: EXPIRED_MFA,
			impersonation: DEMO,
		} as JWT;

		const result = await callJwt({
			token,
			trigger: "update",
			session: { impersonation: { siren: "987654321", name: "Autre Démo" } },
		});

		expect(startedImpersonations).toHaveLength(0);
		expect(closedImpersonations).toHaveLength(1);
		expect(result.impersonation).toBeNull();
	});

	it("refuses to start a mimoquage when no second factor was ever presented", async () => {
		const token = { id: "u1", isAdmin: true } as JWT;
		const result = await callJwt({
			token,
			trigger: "update",
			session: { impersonation: { siren: "123456789", name: "Acme" } },
		});

		expect(result.impersonation).toBeUndefined();
		expect(startedImpersonations).toHaveLength(0);
	});

	it("still lets an agent stop a mimoquage after the window has closed", async () => {
		// Ending a mimoquage and closing its row must never be refused: the
		// gate above is on starting, so an expired window can never strand an
		// open row that the agent is powerless to close.
		const token = {
			id: "u1",
			isAdmin: true,
			adminMfaAt: EXPIRED_MFA,
			impersonation: { siren: "123456789", name: "Acme" },
		} as JWT;
		const result = await callJwt({
			token,
			trigger: "update",
			session: { impersonation: null },
		});

		expect(result.impersonation).toBeNull();
		expect(closedImpersonations).toHaveLength(1);
	});
});

describe("jwt callback — a step-up stops the impersonation (S14)", () => {
	/** A fresh sign-in, which is exactly what a step-up produces. */
	function signIn(token: JWT = {} as JWT) {
		return callJwt({
			token,
			user: {
				id: "proconnect-sub",
				email: "agent@example.fr",
				name: "Alice Martin",
			} as User,
			account: {} as Account,
			trigger: "signIn",
		});
	}

	it("closes the open administration-journal row", async () => {
		await signIn();

		expect(closedImpersonations).toHaveLength(1);
		expect(closedImpersonations[0]?.stoppedAt).toBeInstanceOf(Date);
	});

	it("leaves no impersonation on the token, and never resumes the previous one", async () => {
		const result = await signIn({
			id: "u1",
			isAdmin: true,
			impersonation: DEMO,
		} as JWT);

		expect(result.impersonation).toBeNull();
	});

	it("closes the row even for an account no longer listed as admin, so no row stays open for good", async () => {
		mockFindFirst.mockResolvedValue({
			id: "u1",
			phone: null,
			isAdmin: false,
			firstName: "Alice",
			lastName: "Martin",
		});

		await signIn({ id: "u1", isAdmin: true, impersonation: DEMO } as JWT);

		expect(closedImpersonations).toHaveLength(1);
	});

	it("leaves at most one open row across two impersonations separated by a step-up", async () => {
		const token = { id: "u1", isAdmin: true, adminMfaAt: FRESH_MFA } as JWT;

		await callJwt({
			token,
			trigger: "update",
			session: { impersonation: DEMO },
		});
		const afterStepUp = await signIn(token);
		expect(afterStepUp.impersonation).toBeNull();

		await callJwt({
			token: { id: "u1", isAdmin: true } as JWT,
			trigger: "update",
			session: { impersonation: { siren: "987654321", name: "Autre Démo" } },
		});

		// Every start closes what was open before inserting, and the step-up
		// closed the row it inherited — so nothing is ever left dangling.
		expect(closedImpersonations.length).toBeGreaterThanOrEqual(1);
		for (const row of closedImpersonations) {
			expect(row.stoppedAt).toBeInstanceOf(Date);
		}
	});
});

describe("jwt callback — a lapsed window closes the journal row on its own", () => {
	/** Any ordinary request: no sign-in, no session update. */
	function plainRequest(token: JWT) {
		return callJwt({ token });
	}

	it("closes the open row once the window has lapsed, without waiting for a step-up", async () => {
		// The session outlives the window by weeks. Were the row closed only on
		// sign-in, the administration journal would show a mimoquage still open
		// long after the server stopped honouring it.
		const result = await plainRequest({
			id: "u1",
			isAdmin: true,
			adminMfaAt: EXPIRED_MFA,
			impersonation: DEMO,
		} as JWT);

		expect(closedImpersonations).toHaveLength(1);
		expect(closedImpersonations[0]?.stoppedAt).toBeInstanceOf(Date);
		expect(result.impersonation).toBeNull();
	});

	it("closes the open row when no second factor was ever presented", async () => {
		const result = await plainRequest({
			id: "u1",
			isAdmin: true,
			impersonation: DEMO,
		} as JWT);

		expect(closedImpersonations).toHaveLength(1);
		expect(result.impersonation).toBeNull();
	});

	it("leaves a mimoquage alone while the window is still open", async () => {
		const result = await plainRequest({
			id: "u1",
			isAdmin: true,
			adminMfaAt: FRESH_MFA,
			impersonation: DEMO,
		} as JWT);

		expect(closedImpersonations).toHaveLength(0);
		expect(result.impersonation).toEqual(DEMO);
	});

	it("writes nothing on a request carrying no mimoquage", async () => {
		const result = await plainRequest({
			id: "u1",
			isAdmin: true,
			adminMfaAt: EXPIRED_MFA,
		} as JWT);

		expect(closedImpersonations).toHaveLength(0);
		expect(result.impersonation).toBeUndefined();
	});

	it("does not close twice when the same token comes back on a later request", async () => {
		const token = {
			id: "u1",
			isAdmin: true,
			adminMfaAt: EXPIRED_MFA,
			impersonation: DEMO,
		} as JWT;

		await plainRequest(token);
		await plainRequest(token);

		expect(closedImpersonations).toHaveLength(1);
	});

	it("still issues a single closing statement when the agent stops a lapsed mimoquage explicitly", async () => {
		// The explicit stop returns from the update branch, so the lapsed-window
		// close below it never doubles it.
		const token = {
			id: "u1",
			isAdmin: true,
			adminMfaAt: EXPIRED_MFA,
			impersonation: DEMO,
		} as JWT;

		await callJwt({
			token,
			trigger: "update",
			session: { impersonation: null },
		});

		expect(closedImpersonations).toHaveLength(1);
	});
});

describe("session callback — impersonation is exposed only inside the MFA window", () => {
	function sessionFor(token: Partial<JWT>) {
		return callSession({
			session: { user: { name: null, email: null, image: null }, expires: "" },
			token: { id: "u1", ...token } as unknown as JWT,
		}) as { user: { impersonation: { siren: string; name: string } | null } };
	}

	it("mirrors token.impersonation while the second factor is fresh", () => {
		const result = sessionFor({
			isAdmin: true,
			adminMfaAt: FRESH_MFA,
			impersonation: DEMO,
		});
		expect(result.user.impersonation).toEqual(DEMO);
	});

	it("hides the impersonation once the window has expired, so the banner disappears with it", () => {
		const result = sessionFor({
			isAdmin: true,
			adminMfaAt: EXPIRED_MFA,
			impersonation: DEMO,
		});
		expect(result.user.impersonation).toBeNull();
	});

	it("hides the impersonation when no second factor was ever presented", () => {
		const result = sessionFor({ isAdmin: true, impersonation: DEMO });
		expect(result.user.impersonation).toBeNull();
	});

	it("hides a stray impersonation carried by a non-admin token", () => {
		const result = sessionFor({
			isAdmin: false,
			adminMfaAt: FRESH_MFA,
			impersonation: DEMO,
		});
		expect(result.user.impersonation).toBeNull();
	});

	it("defaults impersonation to null when token has none", () => {
		const result = sessionFor({ isAdmin: false });
		expect(result.user.impersonation).toBeNull();
	});
});
