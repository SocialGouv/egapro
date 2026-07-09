import { describe, expect, it } from "vitest";

import {
	computeDeclarationStatus,
	getCurrentCompliancePath,
	hasStartedSecondDeclaration,
	isCancelled,
	isComplianceProcessCompleted,
	isDeclarationSubmitted,
	isDraft,
	isInComplianceProcess,
} from "../shared/declarationStatus";

describe("isDraft", () => {
	it("returns true only for draft", () => {
		expect(isDraft("draft")).toBe(true);
	});

	it("returns false for a submitted status", () => {
		expect(isDraft("demarche_completed")).toBe(false);
	});

	it("returns false for null", () => {
		expect(isDraft(null)).toBe(false);
	});
});

describe("isComplianceProcessCompleted", () => {
	it("returns true only for the terminal FSM state", () => {
		expect(isComplianceProcessCompleted("demarche_completed")).toBe(true);
	});

	it("returns false for any other status", () => {
		expect(isComplianceProcessCompleted("awaiting_cse_opinion")).toBe(false);
		expect(isComplianceProcessCompleted("draft")).toBe(false);
		expect(isComplianceProcessCompleted(null)).toBe(false);
	});
});

describe("isDeclarationSubmitted", () => {
	it("returns false when status is null", () => {
		expect(isDeclarationSubmitted(null)).toBe(false);
	});

	it("returns false when status is draft", () => {
		expect(isDeclarationSubmitted("draft")).toBe(false);
	});

	it("returns true for any non-draft, non-null status", () => {
		expect(isDeclarationSubmitted("awaiting_compliance_path_choice")).toBe(
			true,
		);
		expect(isDeclarationSubmitted("demarche_completed")).toBe(true);
	});
});

describe("isCancelled", () => {
	it("returns false when cancelledAt is null", () => {
		expect(isCancelled({ cancelledAt: null })).toBe(false);
	});

	it("returns true when cancelledAt is a Date", () => {
		expect(isCancelled({ cancelledAt: new Date("2025-04-01") })).toBe(true);
	});
});

describe("computeDeclarationStatus", () => {
	it("returns to_complete when declaration is undefined", () => {
		expect(computeDeclarationStatus(undefined)).toBe("to_complete");
	});

	it("returns to_complete for draft with currentStep 0", () => {
		expect(computeDeclarationStatus({ status: "draft", currentStep: 0 })).toBe(
			"to_complete",
		);
	});

	it("returns to_complete for draft with null currentStep", () => {
		expect(
			computeDeclarationStatus({ status: "draft", currentStep: null }),
		).toBe("to_complete");
	});

	it("returns in_progress for awaiting_compliance_path_choice (action still expected)", () => {
		expect(
			computeDeclarationStatus({
				status: "awaiting_compliance_path_choice",
				currentStep: 6,
			}),
		).toBe("in_progress");
	});

	it("returns in_progress for corrective_actions_chosen (waiting on 2nd decl)", () => {
		expect(
			computeDeclarationStatus({
				status: "corrective_actions_chosen",
				currentStep: 6,
			}),
		).toBe("in_progress");
	});

	it("returns in_progress for awaiting_revision_choice (revised path pending)", () => {
		expect(
			computeDeclarationStatus({
				status: "awaiting_revision_choice",
				currentStep: 6,
			}),
		).toBe("in_progress");
	});

	it("returns in_progress for awaiting_cse_opinion (CSE deposit pending)", () => {
		expect(
			computeDeclarationStatus({
				status: "awaiting_cse_opinion",
				currentStep: 6,
			}),
		).toBe("in_progress");
	});

	it("returns done only for demarche_completed (terminal FSM state)", () => {
		expect(
			computeDeclarationStatus({
				status: "demarche_completed",
				currentStep: 6,
			}),
		).toBe("done");
	});

	it("returns in_progress for draft with currentStep > 0", () => {
		expect(computeDeclarationStatus({ status: "draft", currentStep: 3 })).toBe(
			"in_progress",
		);
	});

	it("returns to_complete when cancelledAt is set, regardless of status", () => {
		expect(
			computeDeclarationStatus({
				status: "awaiting_compliance_path_choice",
				currentStep: 6,
				cancelledAt: new Date("2025-04-01"),
			}),
		).toBe("to_complete");
	});

	it("returns to_complete when cancelledAt is set for in-progress declaration", () => {
		expect(
			computeDeclarationStatus({
				status: "draft",
				currentStep: 3,
				cancelledAt: new Date("2025-04-01"),
			}),
		).toBe("to_complete");
	});

	it("uses existing logic when cancelledAt is null", () => {
		expect(
			computeDeclarationStatus({
				status: "awaiting_compliance_path_choice",
				currentStep: 6,
				cancelledAt: null,
			}),
		).toBe("in_progress");
	});

	it("uses existing logic when cancelledAt is undefined", () => {
		expect(
			computeDeclarationStatus({
				status: "awaiting_compliance_path_choice",
				currentStep: 6,
				cancelledAt: undefined,
			}),
		).toBe("in_progress");
	});
});

describe("getCurrentCompliancePath", () => {
	it("returns firstDeclarationPathChoice when secondDeclarationPathChoice is null", () => {
		expect(
			getCurrentCompliancePath({
				firstDeclarationPathChoice: "justify",
				secondDeclarationPathChoice: null,
			}),
		).toBe("justify");
	});

	it("returns secondDeclarationPathChoice when it is set, ignoring first", () => {
		expect(
			getCurrentCompliancePath({
				firstDeclarationPathChoice: "corrective_action",
				secondDeclarationPathChoice: "joint_evaluation",
			}),
		).toBe("joint_evaluation");
	});

	it("returns null when both pathChoices are null", () => {
		expect(
			getCurrentCompliancePath({
				firstDeclarationPathChoice: null,
				secondDeclarationPathChoice: null,
			}),
		).toBeNull();
	});
});

describe("isInComplianceProcess", () => {
	const noPath = {
		firstDeclarationPathChoice: null,
		secondDeclarationPathChoice: null,
	};

	it("returns true when a first-declaration compliance path is chosen", () => {
		expect(
			isInComplianceProcess({
				status: "corrective_actions_chosen",
				firstDeclarationPathChoice: "justify",
				secondDeclarationPathChoice: null,
			}),
		).toBe(true);
	});

	it("returns true when a second-declaration compliance path is chosen", () => {
		expect(
			isInComplianceProcess({
				status: "revised_joint_evaluation_chosen",
				firstDeclarationPathChoice: null,
				secondDeclarationPathChoice: "joint_evaluation",
			}),
		).toBe(true);
	});

	it("returns true when awaiting the compliance path choice (no path yet)", () => {
		expect(
			isInComplianceProcess({
				status: "awaiting_compliance_path_choice",
				...noPath,
			}),
		).toBe(true);
	});

	it("returns true when awaiting the revision choice (no path yet)", () => {
		expect(
			isInComplianceProcess({ status: "awaiting_revision_choice", ...noPath }),
		).toBe(true);
	});

	it("returns false with no path and a non-compliance status", () => {
		expect(
			isInComplianceProcess({ status: "demarche_completed", ...noPath }),
		).toBe(false);
	});

	it("returns false when status is null and no path chosen", () => {
		expect(isInComplianceProcess({ status: null, ...noPath })).toBe(false);
	});
});

describe("hasStartedSecondDeclaration", () => {
	it("returns true when a second-declaration step was reached", () => {
		expect(
			hasStartedSecondDeclaration({
				secondDeclarationStep: 2,
				secondDeclarationPathChoice: null,
			}),
		).toBe(true);
	});

	it("returns true when a second-declaration path was chosen (no step)", () => {
		expect(
			hasStartedSecondDeclaration({
				secondDeclarationStep: null,
				secondDeclarationPathChoice: "justify",
			}),
		).toBe(true);
	});

	it("returns false when neither step nor path is set", () => {
		expect(
			hasStartedSecondDeclaration({
				secondDeclarationStep: null,
				secondDeclarationPathChoice: null,
			}),
		).toBe(false);
	});
});
