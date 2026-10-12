import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ADMIN_MFA_WINDOW_SECONDS } from "~/modules/domain";
import type { DbClient } from "~/server/services/declarationLockService";
import {
	assertNotImpersonating,
	canAccessCompany,
	getEffectiveSiren,
	isImpersonating,
	isImpersonatingSiren,
	resolveAuthorizedSiren,
} from "../companyAccess";
import { isUserLinkedToSiren } from "../companyLink";

const mockIsUserLinkedToSiren = vi.mocked(isUserLinkedToSiren);

const DB = {} as DbClient;

const NOW = new Date("2026-03-10T12:00:00Z");
const NOW_SECONDS = Math.floor(NOW.getTime() / 1000);

/** A second factor presented a minute ago — comfortably inside the window. */
const FRESH_MFA = NOW_SECONDS - 60;
/** A second factor one second past the window — the case S14 turns on. */
const EXPIRED_MFA = NOW_SECONDS - ADMIN_MFA_WINDOW_SECONDS - 1;

const DEMO = { siren: "123456789", name: "Société Démo" };

function makeSession(overrides: Partial<Session["user"]> = {}): Session {
	return {
		user: {
			id: "user-1",
			name: "Admin",
			email: "admin@example.com",
			image: null,
			siret: null,
			phone: null,
			isAdmin: false,
			impersonation: null,
			adminMfaAt: null,
			...overrides,
		},
		expires: "2099-01-01",
	};
}

/** An admin mimoquing « Société Démo » with a second factor inside the window. */
function impersonatingAdmin(overrides: Partial<Session["user"]> = {}): Session {
	return makeSession({
		isAdmin: true,
		adminMfaAt: FRESH_MFA,
		impersonation: DEMO,
		siret: "98765432100015",
		...overrides,
	});
}

describe("getEffectiveSiren", () => {
	it("returns null when the session is null", () => {
		expect(getEffectiveSiren(null, NOW)).toBeNull();
	});

	it("returns null when the session carries no user", () => {
		expect(getEffectiveSiren({ expires: "2099-01-01" } as Session, NOW)).toBe(
			null,
		);
	});

	it("returns the impersonated SIREN for an admin inside the window", () => {
		expect(getEffectiveSiren(impersonatingAdmin(), NOW)).toBe("123456789");
	});

	it("falls back to the agent's own SIREN once the window has expired", () => {
		const session = impersonatingAdmin({ adminMfaAt: EXPIRED_MFA });
		expect(getEffectiveSiren(session, NOW)).toBe("987654321");
	});

	it("falls back to the agent's own SIREN when no second factor was ever presented", () => {
		const session = impersonatingAdmin({ adminMfaAt: null });
		expect(getEffectiveSiren(session, NOW)).toBe("987654321");
	});

	it("returns null for an out-of-window admin who has no SIRET of their own", () => {
		const session = impersonatingAdmin({
			adminMfaAt: EXPIRED_MFA,
			siret: null,
		});
		expect(getEffectiveSiren(session, NOW)).toBeNull();
	});

	it("extracts the SIREN from the SIRET of an ordinary declarant", () => {
		expect(
			getEffectiveSiren(makeSession({ siret: "12345678900021" }), NOW),
		).toBe("123456789");
	});

	it("returns null for a malformed SIRET rather than a truncated SIREN", () => {
		expect(getEffectiveSiren(makeSession({ siret: "1234" }), NOW)).toBeNull();
		expect(getEffectiveSiren(makeSession({ siret: "abcdefghij" }), NOW)).toBe(
			null,
		);
	});

	it("ignores a stray impersonation carried by a non-admin session", () => {
		const session = makeSession({
			isAdmin: false,
			adminMfaAt: FRESH_MFA,
			impersonation: DEMO,
			siret: "98765432100015",
		});
		expect(getEffectiveSiren(session, NOW)).toBe("987654321");
	});

	it("defaults `now` to the current time", () => {
		const session = impersonatingAdmin({
			adminMfaAt: Math.floor(Date.now() / 1000) - 60,
		});
		expect(getEffectiveSiren(session)).toBe("123456789");
	});
});

describe("isImpersonatingSiren", () => {
	it("returns false when session is null", () => {
		expect(isImpersonatingSiren(null, "123456789", NOW)).toBe(false);
	});

	it("returns false for a non-admin even if impersonation is present", () => {
		const session = makeSession({
			isAdmin: false,
			adminMfaAt: FRESH_MFA,
			impersonation: DEMO,
		});
		expect(isImpersonatingSiren(session, "123456789", NOW)).toBe(false);
	});

	it("returns false for an admin with no impersonation", () => {
		const session = makeSession({
			isAdmin: true,
			adminMfaAt: FRESH_MFA,
			impersonation: null,
		});
		expect(isImpersonatingSiren(session, "123456789", NOW)).toBe(false);
	});

	it("returns false when the SIREN does not match the impersonated one", () => {
		expect(isImpersonatingSiren(impersonatingAdmin(), "987654321", NOW)).toBe(
			false,
		);
	});

	it("returns true when admin is impersonating exactly this SIREN", () => {
		expect(isImpersonatingSiren(impersonatingAdmin(), "123456789", NOW)).toBe(
			true,
		);
	});

	it("stops bypassing ownership once the window has expired", () => {
		const session = impersonatingAdmin({ adminMfaAt: EXPIRED_MFA });
		expect(isImpersonatingSiren(session, "123456789", NOW)).toBe(false);
	});

	it("defaults `now` to the current time", () => {
		const session = impersonatingAdmin({
			adminMfaAt: Math.floor(Date.now() / 1000) - 60,
		});
		expect(isImpersonatingSiren(session, "123456789")).toBe(true);
	});
});

describe("isImpersonating", () => {
	it("returns false when session is null", () => {
		expect(isImpersonating(null, NOW)).toBe(false);
	});

	it("returns true for an admin impersonating inside the window", () => {
		expect(isImpersonating(impersonatingAdmin(), NOW)).toBe(true);
	});

	it("returns false once the window has expired", () => {
		expect(
			isImpersonating(impersonatingAdmin({ adminMfaAt: EXPIRED_MFA }), NOW),
		).toBe(false);
	});

	it("returns false for a non-admin carrying a stray impersonation", () => {
		const session = makeSession({
			isAdmin: false,
			adminMfaAt: FRESH_MFA,
			impersonation: DEMO,
		});
		expect(isImpersonating(session, NOW)).toBe(false);
	});

	it("defaults `now` to the current time", () => {
		const session = impersonatingAdmin({
			adminMfaAt: Math.floor(Date.now() / 1000) - 60,
		});
		expect(isImpersonating(session)).toBe(true);
	});
});

describe("assertNotImpersonating", () => {
	it("does not throw when session is null", () => {
		expect(() => assertNotImpersonating(null, NOW)).not.toThrow();
	});

	it("does not throw for a non-impersonating user", () => {
		const session = makeSession({ isAdmin: false, impersonation: null });
		expect(() => assertNotImpersonating(session, NOW)).not.toThrow();
	});

	it("does not throw for an admin who is not impersonating", () => {
		const session = makeSession({
			isAdmin: true,
			adminMfaAt: FRESH_MFA,
			impersonation: null,
		});
		expect(() => assertNotImpersonating(session, NOW)).not.toThrow();
	});

	it("does not throw for a non-admin with a stray impersonation field", () => {
		// Defensive: only admins can mint an impersonation in the JWT, so a
		// non-admin should never be blocked even if the session object
		// happens to carry an `impersonation` value.
		const session = makeSession({
			isAdmin: false,
			adminMfaAt: FRESH_MFA,
			impersonation: DEMO,
		});
		expect(() => assertNotImpersonating(session, NOW)).not.toThrow();
	});

	it("throws a FORBIDDEN TRPCError when an admin is impersonating", () => {
		expect(() => assertNotImpersonating(impersonatingAdmin(), NOW)).toThrow(
			expect.objectContaining({
				name: "TRPCError",
				code: "FORBIDDEN",
				message: expect.stringContaining("mimoquage"),
			}),
		);
	});

	it("stops blocking writes once the window has expired — the agent is an ordinary declarant on their own SIREN (S8)", () => {
		// Not a loosened guard: `getEffectiveSiren` has already stopped
		// resolving the impersonated company, so the write this lets through
		// can only target the agent's own perimeter.
		const session = impersonatingAdmin({ adminMfaAt: EXPIRED_MFA });
		expect(() => assertNotImpersonating(session, NOW)).not.toThrow();
		expect(getEffectiveSiren(session, NOW)).toBe("987654321");
	});

	it("defaults `now` to the current time", () => {
		const session = impersonatingAdmin({
			adminMfaAt: Math.floor(Date.now() / 1000) - 60,
		});
		expect(() => assertNotImpersonating(session)).toThrow();
	});
});

describe("getEffectiveSiren", () => {
	it("returns null without a session", () => {
		expect(getEffectiveSiren(null)).toBeNull();
	});

	it("extracts the SIREN from a well-formed SIRET", () => {
		expect(getEffectiveSiren(makeSession({ siret: "53284719600015" }))).toBe(
			"532847196",
		);
	});

	it("returns null when the session carries no SIRET", () => {
		expect(getEffectiveSiren(makeSession({ siret: null }))).toBeNull();
	});

	// Slicing a malformed SIRET used to hand back a nine-character lookalike,
	// which then reached the database as if it were a real SIREN.
	it.each([
		["too short", "1234"],
		["letters in the SIREN part", "ABCDEFGHI00015"],
		["punctuation in the SIREN part", "532-847-19600015"],
		["blank", "   "],
	])("returns null for a malformed SIRET (%s)", (_label, siret) => {
		expect(getEffectiveSiren(makeSession({ siret }))).toBeNull();
	});

	it("returns the impersonated SIREN for an admin inside the MFA window", () => {
		expect(
			getEffectiveSiren(
				makeSession({
					isAdmin: true,
					adminMfaAt: FRESH_MFA,
					siret: "53284719600015",
					impersonation: { siren: "987654321", name: "Société Démo" },
				}),
				NOW,
			),
		).toBe("987654321");
	});

	it("returns null rather than a lookalike for a malformed impersonated SIREN", () => {
		expect(
			getEffectiveSiren(
				makeSession({
					isAdmin: true,
					adminMfaAt: FRESH_MFA,
					siret: "53284719600015",
					impersonation: { siren: "not-a-siren", name: "Société Démo" },
				}),
				NOW,
			),
		).toBeNull();
	});
});

describe("canAccessCompany", () => {
	beforeEach(() => {
		mockIsUserLinkedToSiren.mockReset();
		mockIsUserLinkedToSiren.mockResolvedValue(true);
	});

	it("grants a declarant linked to the company in the database", async () => {
		await expect(
			canAccessCompany(DB, makeSession(), "532847196", NOW),
		).resolves.toBe(true);
		expect(mockIsUserLinkedToSiren).toHaveBeenCalledWith(
			DB,
			"user-1",
			"532847196",
		);
	});

	it("refuses a declarant whose link is gone, whatever the JWT still says", async () => {
		mockIsUserLinkedToSiren.mockResolvedValue(false);

		await expect(
			canAccessCompany(
				DB,
				makeSession({ siret: "53284719600015" }),
				"532847196",
				NOW,
			),
		).resolves.toBe(false);
	});

	it("refuses without a session, and never queries", async () => {
		await expect(canAccessCompany(DB, null, "532847196", NOW)).resolves.toBe(
			false,
		);
		expect(mockIsUserLinkedToSiren).not.toHaveBeenCalled();
	});

	it("grants the impersonated SIREN without a link, and never queries", async () => {
		await expect(
			canAccessCompany(DB, impersonatingAdmin(), DEMO.siren, NOW),
		).resolves.toBe(true);
		expect(mockIsUserLinkedToSiren).not.toHaveBeenCalled();
	});

	it("checks the link for any other SIREN an impersonating admin asks for", async () => {
		mockIsUserLinkedToSiren.mockResolvedValue(false);

		await expect(
			canAccessCompany(DB, impersonatingAdmin(), "987654321", NOW),
		).resolves.toBe(false);
	});

	it("checks the link once the admin's MFA window has lapsed", async () => {
		mockIsUserLinkedToSiren.mockResolvedValue(false);

		await expect(
			canAccessCompany(
				DB,
				impersonatingAdmin({ adminMfaAt: EXPIRED_MFA }),
				DEMO.siren,
				NOW,
			),
		).resolves.toBe(false);
	});

	it("propagates a database failure instead of granting access", async () => {
		mockIsUserLinkedToSiren.mockRejectedValue(new Error("connection lost"));

		await expect(
			canAccessCompany(DB, makeSession(), "532847196", NOW),
		).rejects.toThrow("connection lost");
	});
});

describe("resolveAuthorizedSiren", () => {
	beforeEach(() => {
		mockIsUserLinkedToSiren.mockReset();
		mockIsUserLinkedToSiren.mockResolvedValue(true);
	});

	it("resolves the session SIREN while the link exists", async () => {
		await expect(
			resolveAuthorizedSiren(DB, makeSession({ siret: "53284719600015" }), NOW),
		).resolves.toBe("532847196");
	});

	it("resolves nothing once the link has been revoked", async () => {
		mockIsUserLinkedToSiren.mockResolvedValue(false);

		await expect(
			resolveAuthorizedSiren(DB, makeSession({ siret: "53284719600015" }), NOW),
		).resolves.toBeNull();
	});

	it("resolves nothing for a session without a SIRET, and never queries", async () => {
		await expect(
			resolveAuthorizedSiren(DB, makeSession({ siret: null }), NOW),
		).resolves.toBeNull();
		expect(mockIsUserLinkedToSiren).not.toHaveBeenCalled();
	});

	it("resolves the impersonated SIREN for an admin inside the window", async () => {
		await expect(
			resolveAuthorizedSiren(DB, impersonatingAdmin(), NOW),
		).resolves.toBe(DEMO.siren);
		expect(mockIsUserLinkedToSiren).not.toHaveBeenCalled();
	});
});
