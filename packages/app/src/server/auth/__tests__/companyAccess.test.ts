import type { Session } from "next-auth";
import { describe, expect, it } from "vitest";

import {
	assertNotImpersonating,
	getEffectiveSiren,
	isImpersonatingSiren,
} from "../companyAccess";

function makeSession(overrides: Partial<Session["user"]> = {}): Session | null {
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
			...overrides,
		},
		expires: "2099-01-01",
	};
}

describe("isImpersonatingSiren", () => {
	it("returns false when session is null", () => {
		expect(isImpersonatingSiren(null, "123456789")).toBe(false);
	});

	it("returns false for a non-admin even if impersonation is present", () => {
		const session = makeSession({
			isAdmin: false,
			impersonation: { siren: "123456789", name: "Acme" },
		});
		expect(isImpersonatingSiren(session, "123456789")).toBe(false);
	});

	it("returns false for an admin with no impersonation", () => {
		const session = makeSession({ isAdmin: true, impersonation: null });
		expect(isImpersonatingSiren(session, "123456789")).toBe(false);
	});

	it("returns false when the SIREN does not match the impersonated one", () => {
		const session = makeSession({
			isAdmin: true,
			impersonation: { siren: "123456789", name: "Acme" },
		});
		expect(isImpersonatingSiren(session, "987654321")).toBe(false);
	});

	it("returns true when admin is impersonating exactly this SIREN", () => {
		const session = makeSession({
			isAdmin: true,
			impersonation: { siren: "123456789", name: "Acme" },
		});
		expect(isImpersonatingSiren(session, "123456789")).toBe(true);
	});
});

describe("assertNotImpersonating", () => {
	it("does not throw when session is null", () => {
		expect(() => assertNotImpersonating(null)).not.toThrow();
	});

	it("does not throw for a non-impersonating user", () => {
		const session = makeSession({ isAdmin: false, impersonation: null });
		expect(() => assertNotImpersonating(session)).not.toThrow();
	});

	it("does not throw for an admin who is not impersonating", () => {
		const session = makeSession({ isAdmin: true, impersonation: null });
		expect(() => assertNotImpersonating(session)).not.toThrow();
	});

	it("does not throw for a non-admin with a stray impersonation field", () => {
		// Defensive: only admins can mint an impersonation in the JWT, so a
		// non-admin should never be blocked even if the session object
		// happens to carry an `impersonation` value.
		const session = makeSession({
			isAdmin: false,
			impersonation: { siren: "123456789", name: "Acme" },
		});
		expect(() => assertNotImpersonating(session)).not.toThrow();
	});

	it("throws a FORBIDDEN TRPCError when an admin is impersonating", () => {
		const session = makeSession({
			isAdmin: true,
			impersonation: { siren: "123456789", name: "Acme" },
		});
		expect(() => assertNotImpersonating(session)).toThrow(
			expect.objectContaining({
				name: "TRPCError",
				code: "FORBIDDEN",
				message: expect.stringContaining("mimoquage"),
			}),
		);
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

	it("returns the impersonated SIREN for an admin", () => {
		expect(
			getEffectiveSiren(
				makeSession({
					isAdmin: true,
					siret: "53284719600015",
					impersonation: { siren: "987654321", name: "Société Démo" },
				}),
			),
		).toBe("987654321");
	});

	it("returns null rather than a lookalike for a malformed impersonated SIREN", () => {
		expect(
			getEffectiveSiren(
				makeSession({
					isAdmin: true,
					siret: "53284719600015",
					impersonation: { siren: "not-a-siren", name: "Société Démo" },
				}),
			),
		).toBeNull();
	});
});
