import { describe, expect, it } from "vitest";

import {
	computeDeclarationStatus,
	getCurrentCompliancePath,
	isCancelled,
} from "../shared/declarationStatus";

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

	it("returns done for awaiting_compliance_path_choice", () => {
		expect(
			computeDeclarationStatus({
				status: "awaiting_compliance_path_choice",
				currentStep: 6,
			}),
		).toBe("done");
	});

	it("returns done for corrective_actions_chosen", () => {
		expect(
			computeDeclarationStatus({
				status: "corrective_actions_chosen",
				currentStep: 6,
			}),
		).toBe("done");
	});

	it("returns done for demarche_completed", () => {
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
		).toBe("done");
	});

	it("uses existing logic when cancelledAt is undefined", () => {
		expect(
			computeDeclarationStatus({
				status: "awaiting_compliance_path_choice",
				currentStep: 6,
				cancelledAt: undefined,
			}),
		).toBe("done");
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
