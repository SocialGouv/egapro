import { describe, expect, it } from "vitest";
import {
	ADMIN_MFA_ACR_VALUES,
	ADMIN_MFA_WINDOW_SECONDS,
	isAdminMfaAcr,
	isAdminMfaFresh,
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
