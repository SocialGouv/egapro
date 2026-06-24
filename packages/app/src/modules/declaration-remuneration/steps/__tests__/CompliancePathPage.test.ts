import { describe, expect, it } from "vitest";

import {
	getCompliancePathReadOnlyReason,
	getComplianceState,
} from "../CompliancePathPage";

const noGapCategory = {
	annualBaseWomen: "30000",
	annualBaseMen: "31000",
};

const highGapCategory = {
	annualBaseWomen: "25000",
	annualBaseMen: "35000",
};

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

describe("getCompliancePathReadOnlyReason", () => {
	const baseParams = {
		status: "awaiting_compliance_path_choice",
		pathChoice: null,
		hasSubmittedSecondDeclaration: false,
		hasSubmittedCseOpinion: false,
		hasSubmittedJointEvaluation: false,
		modificationDeadline: new Date("2026-12-01T00:00:00"),
		now: new Date("2026-06-15T00:00:00"),
	} satisfies Parameters<typeof getCompliancePathReadOnlyReason>[0];

	it("returns null when no condition is met", () => {
		expect(getCompliancePathReadOnlyReason(baseParams)).toBeNull();
	});

	it("returns demarche_completed when the démarche is finalised", () => {
		expect(
			getCompliancePathReadOnlyReason({
				...baseParams,
				status: "demarche_completed",
				pathChoice: "justify",
			}),
		).toBe("demarche_completed");
	});

	it("prioritises demarche_completed over a submitted next step", () => {
		expect(
			getCompliancePathReadOnlyReason({
				...baseParams,
				status: "demarche_completed",
				pathChoice: "justify",
				hasSubmittedCseOpinion: true,
			}),
		).toBe("demarche_completed");
	});

	it("returns cse_opinion_submitted for justify once the CSE opinion is submitted", () => {
		expect(
			getCompliancePathReadOnlyReason({
				...baseParams,
				pathChoice: "justify",
				hasSubmittedCseOpinion: true,
			}),
		).toBe("cse_opinion_submitted");
	});

	it("keeps justify editable while the CSE opinion is not submitted", () => {
		expect(
			getCompliancePathReadOnlyReason({ ...baseParams, pathChoice: "justify" }),
		).toBeNull();
	});

	it("returns second_declaration_submitted for corrective_action once the second declaration is submitted", () => {
		expect(
			getCompliancePathReadOnlyReason({
				...baseParams,
				pathChoice: "corrective_action",
				hasSubmittedSecondDeclaration: true,
			}),
		).toBe("second_declaration_submitted");
	});

	it("keeps corrective_action editable while the second declaration is not submitted", () => {
		expect(
			getCompliancePathReadOnlyReason({
				...baseParams,
				pathChoice: "corrective_action",
			}),
		).toBeNull();
	});

	it("returns joint_evaluation_submitted for joint_evaluation once the report is submitted", () => {
		expect(
			getCompliancePathReadOnlyReason({
				...baseParams,
				pathChoice: "joint_evaluation",
				hasSubmittedJointEvaluation: true,
			}),
		).toBe("joint_evaluation_submitted");
	});

	it("keeps joint_evaluation editable while the report is not submitted", () => {
		expect(
			getCompliancePathReadOnlyReason({
				...baseParams,
				pathChoice: "joint_evaluation",
			}),
		).toBeNull();
	});

	it("returns modification_deadline_passed once the deadline is in the past", () => {
		expect(
			getCompliancePathReadOnlyReason({
				...baseParams,
				pathChoice: "justify",
				modificationDeadline: new Date("2026-06-01T00:00:00"),
				now: new Date("2026-06-02T00:00:00"),
			}),
		).toBe("modification_deadline_passed");
	});

	it("prioritises a submitted next step over a passed deadline", () => {
		expect(
			getCompliancePathReadOnlyReason({
				...baseParams,
				pathChoice: "justify",
				hasSubmittedCseOpinion: true,
				modificationDeadline: new Date("2026-06-01T00:00:00"),
				now: new Date("2026-06-02T00:00:00"),
			}),
		).toBe("cse_opinion_submitted");
	});

	it("returns modification_deadline_passed even without a chosen path", () => {
		expect(
			getCompliancePathReadOnlyReason({
				...baseParams,
				pathChoice: null,
				modificationDeadline: new Date("2026-06-01T00:00:00"),
				now: new Date("2026-06-02T00:00:00"),
			}),
		).toBe("modification_deadline_passed");
	});

	it("does not lock the second-round revision choice when only the first-round second declaration was submitted", () => {
		expect(
			getCompliancePathReadOnlyReason({
				...baseParams,
				status: "awaiting_revision_choice",
				pathChoice: "justify",
				hasSubmittedSecondDeclaration: true,
			}),
		).toBeNull();
	});

	it("locks the second-round revision once its own joint evaluation is submitted", () => {
		expect(
			getCompliancePathReadOnlyReason({
				...baseParams,
				status: "revised_joint_evaluation_chosen",
				pathChoice: "joint_evaluation",
				hasSubmittedSecondDeclaration: true,
				hasSubmittedJointEvaluation: true,
			}),
		).toBe("joint_evaluation_submitted");
	});
});
