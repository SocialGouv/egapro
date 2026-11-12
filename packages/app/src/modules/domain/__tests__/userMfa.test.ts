import { describe, expect, it } from "vitest";

import { isUserMfaAcr, USER_MFA_ACR_VALUES } from "~/modules/domain";

describe("USER_MFA_ACR_VALUES", () => {
	it("is the full set of levels that prove a second factor", () => {
		expect([...USER_MFA_ACR_VALUES]).toEqual([
			"eidas0-mfa",
			"eidas1-mfa",
			"eidas2",
			"eidas3",
		]);
	});
});

describe("isUserMfaAcr", () => {
	it.each([...USER_MFA_ACR_VALUES])("accepts %s", (acr) => {
		expect(isUserMfaAcr(acr)).toBe(true);
	});

	it.each([
		"eidas0",
		"eidas1",
	])("rejects %s, which proves no second factor", (acr) => {
		expect(isUserMfaAcr(acr)).toBe(false);
	});

	it("rejects the certification-dirigeant level, which proves no second factor", () => {
		expect(
			isUserMfaAcr(
				"https://proconnect.gouv.fr/assurance/certification-dirigeant",
			),
		).toBe(false);
	});

	it("rejects an unknown level", () => {
		expect(isUserMfaAcr("eidas0-mfa-extra")).toBe(false);
	});

	it.each([
		["null", null],
		["undefined", undefined],
		["a number", 1],
		["an object", { value: "eidas0-mfa" }],
		["an array", ["eidas0-mfa"]],
		["an empty string", ""],
	])("rejects %s", (_label, acr) => {
		expect(isUserMfaAcr(acr)).toBe(false);
	});
});
