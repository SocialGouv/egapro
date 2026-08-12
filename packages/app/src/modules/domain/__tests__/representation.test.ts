import { describe, expect, it } from "vitest";

import {
	computeRepresentationVerdict,
	deriveExecutivesNotComputableReason,
	getRepresentationCampaignYear,
	getRepresentationTarget,
	REPRESENTATION_TARGET_INITIAL,
	REPRESENTATION_TARGET_RAISED,
	REPRESENTATION_TARGET_RAISED_FROM_CAMPAIGN_YEAR,
} from "../shared/representation";

describe("regulatory constants", () => {
	// art. D. 1142-19 — every threshold test below is symbolic, so the literal
	// values are pinned here to catch a silent drift of the regulation.
	it("pins the initial target at 30%", () => {
		expect(REPRESENTATION_TARGET_INITIAL).toBe(30);
	});

	it("pins the raised target at 40%", () => {
		expect(REPRESENTATION_TARGET_RAISED).toBe(40);
	});

	it("pins the raised-target campaign year at 2029", () => {
		expect(REPRESENTATION_TARGET_RAISED_FROM_CAMPAIGN_YEAR).toBe(2029);
	});
});

describe("getRepresentationTarget", () => {
	it("returns 30 for campaigns before 2029", () => {
		expect(getRepresentationTarget(2027)).toBe(REPRESENTATION_TARGET_INITIAL);
		expect(getRepresentationTarget(2028)).toBe(REPRESENTATION_TARGET_INITIAL);
	});

	it("returns 40 from the 2029 campaign onwards", () => {
		expect(getRepresentationTarget(2029)).toBe(REPRESENTATION_TARGET_RAISED);
		expect(getRepresentationTarget(2030)).toBe(REPRESENTATION_TARGET_RAISED);
	});
});

describe("computeRepresentationVerdict", () => {
	it("returns compliant when both percentages reach the 30% target (S13)", () => {
		expect(computeRepresentationVerdict(35, 65, 2027)).toBe("compliant");
	});

	it("returns compliant when the lowest percentage equals the target", () => {
		expect(computeRepresentationVerdict(30, 70, 2027)).toBe("compliant");
		expect(computeRepresentationVerdict(70, 30, 2027)).toBe("compliant");
	});

	it("returns non_compliant when the lowest percentage is below the target (S14)", () => {
		expect(computeRepresentationVerdict(25, 75, 2027)).toBe("non_compliant");
		expect(computeRepresentationVerdict(75, 25, 2027)).toBe("non_compliant");
	});

	it("returns non_compliant just below the target boundary", () => {
		expect(computeRepresentationVerdict(29.99, 70.01, 2027)).toBe(
			"non_compliant",
		);
	});

	it("returns non_compliant for 35/65 once the target is raised in 2029 (S14)", () => {
		expect(computeRepresentationVerdict(35, 65, 2029)).toBe("non_compliant");
	});

	it("returns compliant when both percentages reach the raised 40% target", () => {
		expect(computeRepresentationVerdict(40, 60, 2029)).toBe("compliant");
		expect(computeRepresentationVerdict(45, 55, 2030)).toBe("compliant");
	});

	it("returns not_applicable when the women percentage is null (S15)", () => {
		expect(computeRepresentationVerdict(null, 65, 2027)).toBe("not_applicable");
	});

	it("returns not_applicable when the men percentage is null (S15)", () => {
		expect(computeRepresentationVerdict(35, null, 2027)).toBe("not_applicable");
	});

	it("returns not_applicable when both percentages are null (S15)", () => {
		expect(computeRepresentationVerdict(null, null, 2027)).toBe(
			"not_applicable",
		);
	});

	it("treats a 0% share as a computed value, not as a missing one", () => {
		expect(computeRepresentationVerdict(0, 100, 2027)).toBe("non_compliant");
		expect(computeRepresentationVerdict(100, 0, 2029)).toBe("non_compliant");
	});
});

describe("deriveExecutivesNotComputableReason", () => {
	it("returns aucun_cadre_dirigeant when there is no executive", () => {
		expect(deriveExecutivesNotComputableReason("none")).toBe(
			"aucun_cadre_dirigeant",
		);
	});

	it("returns un_seul_cadre_dirigeant when there is a single executive", () => {
		expect(deriveExecutivesNotComputableReason("one")).toBe(
			"un_seul_cadre_dirigeant",
		);
	});

	it("returns null when the indicator is computable", () => {
		expect(deriveExecutivesNotComputableReason("two_or_more")).toBeNull();
	});
});

describe("getRepresentationCampaignYear", () => {
	it("returns the reference year plus one", () => {
		expect(getRepresentationCampaignYear(2026)).toBe(2027);
		expect(getRepresentationCampaignYear(2028)).toBe(2029);
	});
});

describe("verdict independence (S16)", () => {
	// Each indicator carries its own verdict: an aggregated verdict would let a
	// compliant indicator mask a non-compliant one, so the module surface is
	// pinned to prove no such helper exists.
	it("exposes no aggregated verdict helper", async () => {
		const representation = await import("../shared/representation");
		expect(Object.keys(representation).sort()).toEqual([
			"REPRESENTATION_TARGET_INITIAL",
			"REPRESENTATION_TARGET_RAISED",
			"REPRESENTATION_TARGET_RAISED_FROM_CAMPAIGN_YEAR",
			"computeRepresentationVerdict",
			"deriveExecutivesNotComputableReason",
			"getRepresentationCampaignYear",
			"getRepresentationTarget",
		]);
	});

	it("computes each indicator verdict from its own percentages only", () => {
		const executives = computeRepresentationVerdict(35, 65, 2027);
		const members = computeRepresentationVerdict(25, 75, 2027);
		expect(executives).toBe("compliant");
		expect(members).toBe("non_compliant");
	});
});
