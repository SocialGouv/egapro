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
				isFirstDeclarationLocked: false,
			}),
		).toBe(true);
	});

	it("first declaration: not modifiable once a later submission locked it", () => {
		expect(
			isConcernedDeclarationModifiable({
				isSecondRound: false,
				status: "awaiting_cse_opinion",
				isFirstDeclarationLocked: true,
			}),
		).toBe(false);
	});

	it.each([
		["corrective_actions_chosen", true],
		["awaiting_revision_choice", true],
		["awaiting_cse_opinion", false],
		["demarche_completed", false],
	] as const)("second declaration follows isSecondDeclarationWritable (%s → %s)", (status, expected) => {
		expect(
			isConcernedDeclarationModifiable({
				isSecondRound: true,
				status,
				isFirstDeclarationLocked: true,
			}),
		).toBe(expected);
	});

	it("second declaration ignores the first declaration lock", () => {
		expect(
			isConcernedDeclarationModifiable({
				isSecondRound: true,
				status: "corrective_actions_chosen",
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
