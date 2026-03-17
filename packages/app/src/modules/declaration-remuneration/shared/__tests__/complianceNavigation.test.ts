import { describe, expect, it } from "vitest";
import { getPostComplianceDestination } from "../complianceNavigation";

describe("getPostComplianceDestination", () => {
	it("returns /avis-cse when hasCse is true", () => {
		expect(getPostComplianceDestination(true)).toBe("/avis-cse");
	});

	it("returns confirmation path when hasCse is false", () => {
		expect(getPostComplianceDestination(false)).toBe(
			"/declaration-remuneration/parcours-conformite/confirmation",
		);
	});

	it("returns confirmation path when hasCse is null", () => {
		expect(getPostComplianceDestination(null)).toBe(
			"/declaration-remuneration/parcours-conformite/confirmation",
		);
	});
});
