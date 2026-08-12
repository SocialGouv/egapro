import { describe, expect, it } from "vitest";

import {
	computeRepresentationDeclarationStatus,
	computeRepresentationVerdict,
	deriveExecutivesNotComputableReason,
	getRepresentationCampaignYear,
	getRepresentationTarget,
	isPresumedSubjectToRepresentation,
	isRepresentationPublicationRequired,
	REPRESENTATION_SUBJECTION_WINDOW_YEARS,
	REPRESENTATION_SUBJECTION_WORKFORCE_MIN,
	REPRESENTATION_TARGET_INITIAL,
	REPRESENTATION_TARGET_RAISED,
	REPRESENTATION_TARGET_RAISED_FROM_CAMPAIGN_YEAR,
} from "../shared/representation";

describe("regulatory constants", () => {
	// art. D. 1142-19 — literals pinned here to catch a silent regulatory drift.
	it("pins the initial target at 30%", () => {
		expect(REPRESENTATION_TARGET_INITIAL).toBe(30);
	});

	it("pins the raised target at 40%", () => {
		expect(REPRESENTATION_TARGET_RAISED).toBe(40);
	});

	it("pins the raised-target campaign year at 2029", () => {
		expect(REPRESENTATION_TARGET_RAISED_FROM_CAMPAIGN_YEAR).toBe(2029);
	});

	// art. L. 1142-11 — "at least 1 000 employees".
	it("pins the subjection workforce threshold at 1 000", () => {
		expect(REPRESENTATION_SUBJECTION_WORKFORCE_MIN).toBe(1000);
	});

	it("pins the subjection window at 3 years", () => {
		expect(REPRESENTATION_SUBJECTION_WINDOW_YEARS).toBe(3);
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

describe("isPresumedSubjectToRepresentation", () => {
	it("presumes subjection from a single known year above the threshold (S33)", () => {
		expect(
			isPresumedSubjectToRepresentation(
				[{ year: 2026, workforceEma: 1200 }],
				2026,
			),
		).toBe(true);
	});

	it("presumes subjection when both known years are above the threshold (S34)", () => {
		expect(
			isPresumedSubjectToRepresentation(
				[
					{ year: 2026, workforceEma: 1200 },
					{ year: 2025, workforceEma: 1050 },
				],
				2026,
			),
		).toBe(true);
	});

	it("presumes subjection when the three known years are above the threshold (S35)", () => {
		expect(
			isPresumedSubjectToRepresentation(
				[
					{ year: 2026, workforceEma: 1200 },
					{ year: 2025, workforceEma: 1050 },
					{ year: 2024, workforceEma: 1400 },
				],
				2026,
			),
		).toBe(true);
	});

	it("ignores years older than the three-year sliding window (S35)", () => {
		expect(
			isPresumedSubjectToRepresentation(
				[
					{ year: 2026, workforceEma: 1200 },
					{ year: 2025, workforceEma: 1050 },
					{ year: 2024, workforceEma: 1400 },
					{ year: 2023, workforceEma: 800 },
				],
				2026,
			),
		).toBe(true);
	});

	it("drops the presumption when a single year of the window is below the threshold (S36)", () => {
		expect(
			isPresumedSubjectToRepresentation(
				[
					{ year: 2026, workforceEma: 1200 },
					{ year: 2025, workforceEma: 940 },
					{ year: 2024, workforceEma: 1400 },
				],
				2026,
			),
		).toBe(false);
	});

	it("treats the threshold as inclusive at exactly 1 000 (S37)", () => {
		expect(
			isPresumedSubjectToRepresentation(
				[
					{ year: 2026, workforceEma: 1000 },
					{ year: 2025, workforceEma: 1000 },
					{ year: 2024, workforceEma: 1000 },
				],
				2026,
			),
		).toBe(true);
	});

	it("compares the exact workforce value, without rounding up (S37)", () => {
		expect(
			isPresumedSubjectToRepresentation(
				[{ year: 2026, workforceEma: 999.99 }],
				2026,
			),
		).toBe(false);
	});

	it("presumes subjection when no workforce is known (S38)", () => {
		expect(isPresumedSubjectToRepresentation([], 2026)).toBe(true);
	});

	// Divergence from `getObligationWorkforce`, which reads a missing GIP record as
	// a 0 headcount: here an unknown workforce is neutral, never a below-threshold one.
	it("does not read an unknown workforce as a zero headcount (S38)", () => {
		expect(isPresumedSubjectToRepresentation([], 2026)).toBe(true);
		expect(
			isPresumedSubjectToRepresentation(
				[{ year: 2026, workforceEma: 0 }],
				2026,
			),
		).toBe(false);
	});

	it("ignores years more recent than the reference year (S39)", () => {
		expect(
			isPresumedSubjectToRepresentation(
				[
					{ year: 2027, workforceEma: 500 },
					{ year: 2026, workforceEma: 1200 },
				],
				2026,
			),
		).toBe(true);
	});

	it("stays visible on the available years while the latest vintage is missing (S39)", () => {
		const knownYears = [
			{ year: 2025, workforceEma: 1200 },
			{ year: 2024, workforceEma: 1050 },
		];

		expect(isPresumedSubjectToRepresentation(knownYears, 2026)).toBe(true);
	});

	it("re-evaluates on its own once the missing vintage is published (S39)", () => {
		const knownYears = [
			{ year: 2025, workforceEma: 1200 },
			{ year: 2024, workforceEma: 1050 },
		];
		const afterPublication = [{ year: 2026, workforceEma: 940 }, ...knownYears];

		expect(isPresumedSubjectToRepresentation(afterPublication, 2026)).toBe(
			false,
		);
	});

	it("orders the window by year regardless of the input order", () => {
		expect(
			isPresumedSubjectToRepresentation(
				[
					{ year: 2023, workforceEma: 800 },
					{ year: 2025, workforceEma: 1050 },
					{ year: 2024, workforceEma: 1400 },
					{ year: 2026, workforceEma: 1200 },
				],
				2026,
			),
		).toBe(true);
	});

	it("does not mutate the caller's workforce list", () => {
		const workforces = [
			{ year: 2024, workforceEma: 1400 },
			{ year: 2026, workforceEma: 1200 },
		];

		isPresumedSubjectToRepresentation(workforces, 2026);

		expect(workforces).toEqual([
			{ year: 2024, workforceEma: 1400 },
			{ year: 2026, workforceEma: 1200 },
		]);
	});
});

describe("isRepresentationPublicationRequired", () => {
	it("requires publication when executives are computable, whatever the management body", () => {
		expect(isRepresentationPublicationRequired("two_or_more", false)).toBe(
			true,
		);
		expect(isRepresentationPublicationRequired("two_or_more", true)).toBe(true);
	});

	it("requires publication when a management body exists, whatever the executives count", () => {
		expect(isRepresentationPublicationRequired("none", true)).toBe(true);
		expect(isRepresentationPublicationRequired("one", true)).toBe(true);
	});

	it("does not require publication when no indicator is computable", () => {
		expect(isRepresentationPublicationRequired("none", false)).toBe(false);
		expect(isRepresentationPublicationRequired("one", false)).toBe(false);
	});
});

describe("computeRepresentationDeclarationStatus", () => {
	it("returns done for a submitted declaration, whatever its current step", () => {
		expect(
			computeRepresentationDeclarationStatus({
				status: "submitted",
				currentStep: 5,
			}),
		).toBe("done");
		expect(
			computeRepresentationDeclarationStatus({
				status: "submitted",
				currentStep: 0,
			}),
		).toBe("done");
		expect(
			computeRepresentationDeclarationStatus({
				status: "submitted",
				currentStep: null,
			}),
		).toBe("done");
	});

	it("returns to_complete for a draft still on step 0", () => {
		expect(
			computeRepresentationDeclarationStatus({
				status: "draft",
				currentStep: 0,
			}),
		).toBe("to_complete");
	});

	it("returns to_complete for a draft row carrying no current step", () => {
		expect(
			computeRepresentationDeclarationStatus({
				status: "draft",
				currentStep: null,
			}),
		).toBe("to_complete");
	});

	it("returns in_progress for a draft past step 0", () => {
		expect(
			computeRepresentationDeclarationStatus({
				status: "draft",
				currentStep: 1,
			}),
		).toBe("in_progress");
		expect(
			computeRepresentationDeclarationStatus({
				status: "draft",
				currentStep: 4,
			}),
		).toBe("in_progress");
	});
});

describe("verdict independence (S16)", () => {
	// An aggregated verdict would let a compliant indicator mask a failing one.
	it("exposes no aggregated verdict helper", async () => {
		const representation = await import("../shared/representation");
		expect(Object.keys(representation).sort()).toEqual([
			"REPRESENTATION_SUBJECTION_WINDOW_YEARS",
			"REPRESENTATION_SUBJECTION_WORKFORCE_MIN",
			"REPRESENTATION_TARGET_INITIAL",
			"REPRESENTATION_TARGET_RAISED",
			"REPRESENTATION_TARGET_RAISED_FROM_CAMPAIGN_YEAR",
			"computeRepresentationDeclarationStatus",
			"computeRepresentationVerdict",
			"deriveExecutivesNotComputableReason",
			"getRepresentationCampaignYear",
			"getRepresentationTarget",
			"isPresumedSubjectToRepresentation",
			"isRepresentationPublicationRequired",
		]);
	});

	it("computes each indicator verdict from its own percentages only", () => {
		const executives = computeRepresentationVerdict(35, 65, 2027);
		const members = computeRepresentationVerdict(25, 75, 2027);
		expect(executives).toBe("compliant");
		expect(members).toBe("non_compliant");
	});
});
