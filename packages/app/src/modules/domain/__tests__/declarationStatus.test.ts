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
	isSecondDeclarationDeadlineApplicable,
} from "../shared/declarationStatus";
import type { DeclarationFsmStatus } from "../types";

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
	// The per-status projection is covered exhaustively by
	// demarcheRevisionAndStatus.test.ts (#3975); only classes it does not iterate live here.
	it("returns to_complete for draft with null currentStep", () => {
		expect(
			computeDeclarationStatus({ status: "draft", currentStep: null }),
		).toBe("to_complete");
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

describe("isSecondDeclarationDeadlineApplicable", () => {
	const NO_SECOND_DECLARATION = {
		secondDeclarationStep: null,
		secondDeclarationPathChoice: null,
	};

	const PHASE_1_STATUSES: (DeclarationFsmStatus | null)[] = [
		null,
		"draft",
		"awaiting_compliance_path_choice",
		"joint_evaluation_chosen",
	];

	it.each(
		PHASE_1_STATUSES,
	)("returns false for the phase-1 status %s (first-declaration deadline governs)", (status) => {
		expect(
			isSecondDeclarationDeadlineApplicable({
				status,
				...NO_SECOND_DECLARATION,
			}),
		).toBe(false);
	});

	const ALWAYS_PHASE_2_STATUSES: DeclarationFsmStatus[] = [
		"corrective_actions_chosen",
		"awaiting_revision_choice",
		"revised_joint_evaluation_chosen",
	];

	it.each(
		ALWAYS_PHASE_2_STATUSES,
	)("returns true for the second-declaration status %s even before any step/path is recorded", (status) => {
		expect(
			isSecondDeclarationDeadlineApplicable({
				status,
				...NO_SECOND_DECLARATION,
			}),
		).toBe(true);
	});

	// Anti-regression for the nominal path (#3955): the very first step-2 correction
	// write happens in corrective_actions_chosen while secondDeclarationStep and
	// secondDeclarationPathChoice are still null (this write sets them). The predicate
	// must already select the second-declaration deadline from the status alone.
	it("returns true for corrective_actions_chosen with both second-declaration columns still null", () => {
		expect(
			isSecondDeclarationDeadlineApplicable({
				status: "corrective_actions_chosen",
				secondDeclarationStep: null,
				secondDeclarationPathChoice: null,
			}),
		).toBe(true);
	});

	const TERMINAL_STATUSES: DeclarationFsmStatus[] = [
		"awaiting_cse_opinion",
		"demarche_completed",
	];

	it.each(
		TERMINAL_STATUSES,
	)("returns false for the round-1 terminal status %s when no second declaration was started", (status) => {
		expect(
			isSecondDeclarationDeadlineApplicable({
				status,
				...NO_SECOND_DECLARATION,
			}),
		).toBe(false);
	});

	it.each(
		TERMINAL_STATUSES,
	)("returns true for the terminal status %s once a second-declaration step was reached", (status) => {
		expect(
			isSecondDeclarationDeadlineApplicable({
				status,
				secondDeclarationStep: 2,
				secondDeclarationPathChoice: null,
			}),
		).toBe(true);
	});

	it.each(
		TERMINAL_STATUSES,
	)("returns true for the terminal status %s once a second-declaration path was chosen", (status) => {
		expect(
			isSecondDeclarationDeadlineApplicable({
				status,
				secondDeclarationStep: null,
				secondDeclarationPathChoice: "justify",
			}),
		).toBe(true);
	});
});
