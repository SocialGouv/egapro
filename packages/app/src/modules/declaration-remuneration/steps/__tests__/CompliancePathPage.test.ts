import { describe, expect, it } from "vitest";

import {
	getComplianceState,
	isConcernedDeclarationModifiable,
} from "../CompliancePathPage";

const noGapCategory = {
	annualBaseWomen: "30000",
	annualBaseMen: "31000",
};

const highGapCategory = {
	annualBaseWomen: "25000",
	annualBaseMen: "35000",
};

describe("isConcernedDeclarationModifiable", () => {
	it("first declaration: modifiable while no later submission locked it", () => {
		expect(
			isConcernedDeclarationModifiable({
				isSecondRound: false,
				status: "awaiting_compliance_path_choice",
				firstDeclarationPathChoice: null,
				secondDeclarationPathChoice: null,
				isFirstDeclarationLocked: false,
			}),
		).toBe(true);
	});

	it("first declaration: not modifiable once a later submission locked it", () => {
		expect(
			isConcernedDeclarationModifiable({
				isSecondRound: false,
				status: "awaiting_cse_opinion",
				firstDeclarationPathChoice: "corrective_action",
				secondDeclarationPathChoice: null,
				isFirstDeclarationLocked: true,
			}),
		).toBe(false);
	});

	it.each([
		["corrective_actions_chosen", null, true],
		["awaiting_revision_choice", null, true],
		["awaiting_cse_opinion", null, true],
		["awaiting_cse_opinion", "justify", false],
		["demarche_completed", null, false],
	] as const)("second declaration follows isSecondDeclarationWritable (%s, revised path %s → %s)", (status, secondDeclarationPathChoice, expected) => {
		expect(
			isConcernedDeclarationModifiable({
				isSecondRound: true,
				status,
				firstDeclarationPathChoice: "corrective_action",
				secondDeclarationPathChoice,
				isFirstDeclarationLocked: true,
			}),
		).toBe(expected);
	});

	it("second declaration ignores the first declaration lock", () => {
		expect(
			isConcernedDeclarationModifiable({
				isSecondRound: true,
				status: "corrective_actions_chosen",
				firstDeclarationPathChoice: "corrective_action",
				secondDeclarationPathChoice: null,
				isFirstDeclarationLocked: true,
			}),
		).toBe(true);
	});
});

describe("getComplianceState", () => {
	it("returns no_gap when no categories have gaps above threshold", () => {
		const result = getComplianceState(null, false, [noGapCategory], []);
		expect(result).toEqual({ type: "no_gap" });
	});

	it("returns no_gap with empty categories", () => {
		const result = getComplianceState(null, false, [], []);
		expect(result).toEqual({ type: "no_gap" });
	});

	it("returns first_round when gaps exist and no compliance path set", () => {
		const result = getComplianceState(null, false, [highGapCategory], []);
		expect(result).toEqual({ type: "first_round" });
	});

	it("returns first_round when path is corrective_action but second declaration not submitted", () => {
		const result = getComplianceState(
			"corrective_action",
			false,
			[highGapCategory],
			[],
		);
		expect(result).toEqual({ type: "first_round" });
	});

	it("returns first_round when path is corrective_action, submitted, but correction gaps resolved", () => {
		const result = getComplianceState(
			"corrective_action",
			true,
			[highGapCategory],
			[noGapCategory],
		);
		expect(result).toEqual({ type: "first_round" });
	});

	it("returns second_round when corrective_action submitted and correction gaps persist", () => {
		const result = getComplianceState(
			"corrective_action",
			true,
			[highGapCategory],
			[highGapCategory],
		);
		expect(result).toEqual({ type: "second_round" });
	});

	it("returns first_round when path is joint_evaluation regardless of second declaration", () => {
		const result = getComplianceState(
			"joint_evaluation",
			true,
			[highGapCategory],
			[highGapCategory],
		);
		expect(result).toEqual({ type: "first_round" });
	});

	it("returns first_round when path is justify", () => {
		const result = getComplianceState("justify", false, [highGapCategory], []);
		expect(result).toEqual({ type: "first_round" });
	});
});
