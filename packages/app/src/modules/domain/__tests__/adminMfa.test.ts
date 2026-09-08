import { describe, expect, it } from "vitest";
import {
	ADMIN_MFA_ACR_VALUES,
	ADMIN_MFA_WINDOW_SECONDS,
	isAdminMfaAcr,
	isAdminMfaFresh,
	resolveAdminAccess,
} from "~/modules/domain";

const AUTH_AT = Math.floor(Date.parse("2026-03-10T08:00:00.000Z") / 1000);

/** Instant `elapsed` seconds after the authentication. */
function at(elapsed: number): Date {
	return new Date((AUTH_AT + elapsed) * 1000);
}

describe("ADMIN_MFA_WINDOW_SECONDS", () => {
	it("is the 8-hour backoffice window", () => {
		expect(ADMIN_MFA_WINDOW_SECONDS).toBe(8 * 60 * 60);
	});
});

describe("isAdminMfaAcr", () => {
	it("accepts eidas1-mfa", () => {
		expect(isAdminMfaAcr("eidas1-mfa")).toBe(true);
	});

	it("accepts every level of the published set", () => {
		for (const acr of ADMIN_MFA_ACR_VALUES) {
			expect(isAdminMfaAcr(acr)).toBe(true);
		}
	});

	it("rejects eidas1, which proves no second factor", () => {
		expect(isAdminMfaAcr("eidas1")).toBe(false);
	});

	it.each([
		"eidas2",
		"eidas3",
	])("rejects %s — an identity verification level, not a second factor", (acr) => {
		expect(isAdminMfaAcr(acr)).toBe(false);
	});

	it("rejects the certification-dirigeant level", () => {
		expect(
			isAdminMfaAcr(
				"https://proconnect.gouv.fr/assurance/certification-dirigeant",
			),
		).toBe(false);
	});

	it("rejects an unknown level", () => {
		expect(isAdminMfaAcr("eidas1-mfa-extra")).toBe(false);
	});

	it.each([
		["null", null],
		["undefined", undefined],
		["a number", 1],
		["an object", { value: "eidas1-mfa" }],
		["an array", ["eidas1-mfa"]],
		["an empty string", ""],
	])("rejects %s", (_label, acr) => {
		expect(isAdminMfaAcr(acr)).toBe(false);
	});
});

describe("isAdminMfaFresh", () => {
	it("is fresh one second before the window closes", () => {
		expect(isAdminMfaFresh(AUTH_AT, at(ADMIN_MFA_WINDOW_SECONDS - 1))).toBe(
			true,
		);
	});

	it("is stale exactly when the window closes", () => {
		expect(isAdminMfaFresh(AUTH_AT, at(ADMIN_MFA_WINDOW_SECONDS))).toBe(false);
	});

	it("is stale one second after the window closes", () => {
		expect(isAdminMfaFresh(AUTH_AT, at(ADMIN_MFA_WINDOW_SECONDS + 1))).toBe(
			false,
		);
	});

	it("is fresh at the very instant of the authentication", () => {
		expect(isAdminMfaFresh(AUTH_AT, at(0))).toBe(true);
	});

	it("stays fresh when the provider clock runs slightly ahead", () => {
		expect(isAdminMfaFresh(AUTH_AT, at(-5))).toBe(true);
	});

	it("ignores sub-second precision of the current instant", () => {
		const justBefore = new Date(
			(AUTH_AT + ADMIN_MFA_WINDOW_SECONDS) * 1000 - 1,
		);
		expect(isAdminMfaFresh(AUTH_AT, justBefore)).toBe(true);
	});

	it.each([
		["undefined", undefined],
		["null", null],
		["NaN", Number.NaN],
		["Infinity", Number.POSITIVE_INFINITY],
	])("is never fresh when the date is %s", (_label, adminMfaAt) => {
		expect(isAdminMfaFresh(adminMfaAt, at(0))).toBe(false);
	});
});

describe("resolveAdminAccess", () => {
	it.each([
		["no session at all", null],
		["an undefined session", undefined],
	])("sends %s back to the sign-in page", (_label, session) => {
		expect(resolveAdminAccess(session, at(0))).toEqual({ type: "login" });
	});

	it("sends a token predating the admin field back to the sign-in page", () => {
		// Signed in before the grant was minted into the token: the absence of
		// the field is not the same as `false`, and only a fresh sign-in can
		// tell them apart.
		expect(resolveAdminAccess({ adminMfaAt: AUTH_AT }, at(0))).toEqual({
			type: "login",
		});
	});

	it("turns a user without the admin grant away towards Mon espace", () => {
		// Silent refusal, even with a fresh second factor: the backoffice is
		// never mentioned to someone who has no business there.
		expect(
			resolveAdminAccess({ isAdmin: false, adminMfaAt: AUTH_AT }, at(0)),
		).toEqual({ type: "monEspace" });
	});

	it("lets an eligible agent in inside the window", () => {
		expect(
			resolveAdminAccess({ isAdmin: true, adminMfaAt: AUTH_AT }, at(0)),
		).toEqual({ type: "allow" });
	});

	it("still lets an eligible agent in one second before the window closes", () => {
		expect(
			resolveAdminAccess(
				{ isAdmin: true, adminMfaAt: AUTH_AT },
				at(ADMIN_MFA_WINDOW_SECONDS - 1),
			),
		).toEqual({ type: "allow" });
	});

	it("reports an expiry exactly on the window boundary", () => {
		expect(
			resolveAdminAccess(
				{ isAdmin: true, adminMfaAt: AUTH_AT },
				at(ADMIN_MFA_WINDOW_SECONDS),
			),
		).toEqual({ type: "resume", reason: "expired" });
	});

	it("reports an expiry when the authentication is older than the window", () => {
		expect(
			resolveAdminAccess(
				{ isAdmin: true, adminMfaAt: AUTH_AT },
				at(ADMIN_MFA_WINDOW_SECONDS + 1),
			),
		).toEqual({ type: "resume", reason: "expired" });
	});

	it.each([
		["undefined", undefined],
		["null", null],
		["NaN", Number.NaN],
		["Infinity", Number.POSITIVE_INFINITY],
	])("reports an authentication that never happened when the date is %s", (_label, adminMfaAt) => {
		// A session opened before this feature shipped lands here too: the
		// wording stays true, and the action offered is the same.
		expect(resolveAdminAccess({ isAdmin: true, adminMfaAt }, at(0))).toEqual({
			type: "resume",
			reason: "missing",
		});
	});
});
