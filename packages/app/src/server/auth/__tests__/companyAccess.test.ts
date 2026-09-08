import type { Session } from "next-auth";
import { describe, expect, it } from "vitest";

import { ADMIN_MFA_WINDOW_SECONDS } from "~/modules/domain";
import {
	assertNotImpersonating,
	getEffectiveSiren,
	isImpersonating,
	isImpersonatingSiren,
} from "../companyAccess";

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
