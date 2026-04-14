import { TRPCError } from "@trpc/server";
import type { Session } from "next-auth";
import { describe, expect, it } from "vitest";

import { assertNotImpersonating, isImpersonatingSiren } from "../companyAccess";

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

	it("throws a FORBIDDEN TRPCError when an admin is impersonating", () => {
		const session = makeSession({
			isAdmin: true,
			impersonation: { siren: "123456789", name: "Acme" },
		});
		expect(() => assertNotImpersonating(session)).toThrow(TRPCError);
		try {
			assertNotImpersonating(session);
		} catch (error) {
			expect(error).toBeInstanceOf(TRPCError);
			expect((error as TRPCError).code).toBe("FORBIDDEN");
			expect((error as TRPCError).message).toContain("mimoquage");
		}
	});
});
