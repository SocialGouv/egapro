import { describe, expect, it } from "vitest";
import {
	applyDeclarationClosure,
	computeDeclarationStatus,
	getCurrentCompliancePath,
	hasStartedSecondDeclaration,
	isCancelled,
	isCompliancePathStepApplicable,
	isComplianceProcessCompleted,
	isDeclarationSubmitted,
	isDeclarationWritingClosed,
	isDraft,
	isInComplianceProcess,
	isJointEvaluationWritable,
	isSecondDeclarationDeadlineApplicable,
	isSecondDeclarationWritable,
} from "../shared/declarationStatus";
import type { CampaignDeadlines, DeclarationFsmStatus } from "../types";
import { DECLARATION_FSM_STATUSES } from "../types";

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

describe("isDeclarationWritingClosed", () => {
	const past = new Date("2020-01-01T00:00:00Z");
	const future = new Date("2999-01-01T00:00:00Z");

	it("closes writing only when the démarche is completed and the deadline elapsed", () => {
		expect(isDeclarationWritingClosed("demarche_completed", past)).toBe(true);
	});

	it("keeps writing open while the modification deadline has not elapsed", () => {
		expect(isDeclarationWritingClosed("demarche_completed", future)).toBe(
			false,
		);
	});

	it("keeps writing open while the démarche is still running", () => {
		expect(
			isDeclarationWritingClosed("awaiting_compliance_path_choice", past),
		).toBe(false);
		expect(isDeclarationWritingClosed("awaiting_cse_opinion", past)).toBe(
			false,
		);
		expect(isDeclarationWritingClosed("draft", past)).toBe(false);
		expect(isDeclarationWritingClosed(null, past)).toBe(false);
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

describe("isCompliancePathStepApplicable", () => {
	const NO_PATH_CHOICE = {
		firstDeclarationPathChoice: null,
		secondDeclarationPathChoice: null,
	};

	const NON_TERMINAL_STATUSES: (DeclarationFsmStatus | null)[] = [
		null,
		"draft",
		"awaiting_compliance_path_choice",
		"corrective_actions_chosen",
		"joint_evaluation_chosen",
		"awaiting_revision_choice",
		"revised_joint_evaluation_chosen",
	];

	it.each(
		NON_TERMINAL_STATUSES,
	)("returns true for the non-terminal status %s, even with no path choice recorded", (status) => {
		expect(isCompliancePathStepApplicable({ status, ...NO_PATH_CHOICE })).toBe(
			true,
		);
	});

	const TERMINAL_STATUSES: DeclarationFsmStatus[] = [
		"awaiting_cse_opinion",
		"demarche_completed",
	];

	it.each(
		TERMINAL_STATUSES,
	)("returns false for the terminal status %s reached with no path choice (skipped via a direct transition)", (status) => {
		expect(isCompliancePathStepApplicable({ status, ...NO_PATH_CHOICE })).toBe(
			false,
		);
	});

	it.each(
		TERMINAL_STATUSES,
	)("returns true for the terminal status %s once a first-declaration path was chosen", (status) => {
		expect(
			isCompliancePathStepApplicable({
				status,
				firstDeclarationPathChoice: "justify",
				secondDeclarationPathChoice: null,
			}),
		).toBe(true);
	});

	it.each(
		TERMINAL_STATUSES,
	)("returns true for the terminal status %s once a second-declaration path was chosen", (status) => {
		expect(
			isCompliancePathStepApplicable({
				status,
				firstDeclarationPathChoice: null,
				secondDeclarationPathChoice: "corrective_action",
			}),
		).toBe(true);
	});
});

const ALL_STATUSES: (DeclarationFsmStatus | null)[] = [
	...DECLARATION_FSM_STATUSES,
	null,
];

function allStatusesExcept(
	writable: DeclarationFsmStatus[],
): (DeclarationFsmStatus | null)[] {
	return ALL_STATUSES.filter(
		(status) => !writable.some((allowed) => allowed === status),
	);
}

describe("isSecondDeclarationWritable", () => {
	// Mirrors the `from` set of the `submit_second_declaration` transition in v2027.1.json.
	const WRITABLE: DeclarationFsmStatus[] = [
		"corrective_actions_chosen",
		"awaiting_revision_choice",
	];

	it.each(
		WRITABLE,
	)("returns true for %s, where the engine still exposes submit_second_declaration", (status) => {
		expect(isSecondDeclarationWritable(status)).toBe(true);
	});

	it.each(
		allStatusesExcept(WRITABLE),
	)("returns false for %s, where no submit_second_declaration transition exists", (status) => {
		expect(isSecondDeclarationWritable(status)).toBe(false);
	});
});

describe("isJointEvaluationWritable", () => {
	// Mirrors the `from` set of the `submit_joint_evaluation` transition in v2027.1.json.
	const WRITABLE: DeclarationFsmStatus[] = [
		"joint_evaluation_chosen",
		"revised_joint_evaluation_chosen",
	];

	it.each(
		WRITABLE,
	)("returns true for %s, where the engine still exposes submit_joint_evaluation", (status) => {
		expect(isJointEvaluationWritable(status)).toBe(true);
	});

	it.each(
		allStatusesExcept(WRITABLE),
	)("returns false for %s, where no submit_joint_evaluation transition exists", (status) => {
		expect(isJointEvaluationWritable(status)).toBe(false);
	});

	it("returns false once the démarche is completed, which only reopens submit_cse_opinion", () => {
		expect(isJointEvaluationWritable("demarche_completed")).toBe(false);
	});
});

describe("applyDeclarationClosure", () => {
	const ROW_YEAR = 2026;
	const CURRENT_YEAR = 2028;
	// Step deadline for `corrective_actions_chosen` (decl2ModificationDeadline)
	// and for `draft`/null (decl1ModificationDeadline) both fall well inside
	// this window, so a single deadlines fixture can drive every scenario.
	const DEADLINES: CampaignDeadlines = {
		gipPublicationDate: null,
		campaignStartDate: null,
		decl1ModificationDeadline: new Date(2026, 5, 1),
		decl1JustificationDeadline: new Date(2027, 2, 1),
		decl1JointEvaluationDeadline: new Date(2026, 7, 1),
		decl2ModificationDeadline: new Date(2026, 11, 1),
		decl2JustificationDeadline: new Date(2026, 11, 1),
		decl2JointEvaluationDeadline: new Date(2027, 0, 1),
		decl2CseOpinionDeadline: new Date(2027, 1, 1),
		pathChoiceDeadline: new Date(2027, 0, 1),
		pathChoiceRound1Deadline: new Date(2026, 6, 1),
	};
	const PAST_DEADLINE_NOW = new Date(CURRENT_YEAR, 0, 1);
	const BEFORE_DEADLINE_NOW = new Date(ROW_YEAR, 0, 15);

	it("S1 — closes an in_progress past-year row past its step deadline as closed_incomplete", () => {
		expect(
			applyDeclarationClosure({
				status: "in_progress",
				fsmStatus: "corrective_actions_chosen",
				year: ROW_YEAR,
				currentYear: CURRENT_YEAR,
				deadlines: DEADLINES,
				now: PAST_DEADLINE_NOW,
			}),
		).toBe("closed_incomplete");
	});

	it("S2 — closes a to_complete past-year row past its step deadline as closed_not_done", () => {
		expect(
			applyDeclarationClosure({
				status: "to_complete",
				fsmStatus: "draft",
				year: ROW_YEAR,
				currentYear: CURRENT_YEAR,
				deadlines: DEADLINES,
				now: PAST_DEADLINE_NOW,
			}),
		).toBe("closed_not_done");
	});

	it("S3 — a past year whose step deadline has not yet elapsed stays in_progress", () => {
		expect(
			applyDeclarationClosure({
				status: "in_progress",
				fsmStatus: "awaiting_cse_opinion",
				year: ROW_YEAR,
				currentYear: ROW_YEAR + 1,
				deadlines: DEADLINES,
				now: BEFORE_DEADLINE_NOW,
			}),
		).toBe("in_progress");
	});

	it("S4 — done never closes, however far past the deadline", () => {
		expect(
			applyDeclarationClosure({
				status: "done",
				fsmStatus: "demarche_completed",
				year: ROW_YEAR,
				currentYear: CURRENT_YEAR,
				deadlines: DEADLINES,
				now: PAST_DEADLINE_NOW,
			}),
		).toBe("done");
	});

	it("S5 — the current year never closes, even past its own deadline", () => {
		expect(
			applyDeclarationClosure({
				status: "to_complete",
				fsmStatus: "draft",
				year: CURRENT_YEAR,
				currentYear: CURRENT_YEAR,
				deadlines: DEADLINES,
				now: PAST_DEADLINE_NOW,
			}),
		).toBe("to_complete");
	});

	it("never closes a future year relative to currentYear", () => {
		expect(
			applyDeclarationClosure({
				status: "in_progress",
				fsmStatus: "corrective_actions_chosen",
				year: CURRENT_YEAR + 1,
				currentYear: CURRENT_YEAR,
				deadlines: DEADLINES,
				now: PAST_DEADLINE_NOW,
			}),
		).toBe("in_progress");
	});

	it("treats the deadline instant itself as not yet passed (strict inequality)", () => {
		expect(
			applyDeclarationClosure({
				status: "to_complete",
				fsmStatus: "draft",
				year: ROW_YEAR,
				currentYear: CURRENT_YEAR,
				deadlines: DEADLINES,
				now: DEADLINES.decl1ModificationDeadline,
			}),
		).toBe("to_complete");
	});

	it("never closes when the FSM status carries no step deadline (demarche_completed's null)", () => {
		expect(
			applyDeclarationClosure({
				status: "in_progress",
				fsmStatus: "demarche_completed",
				year: ROW_YEAR,
				currentYear: CURRENT_YEAR,
				deadlines: DEADLINES,
				now: PAST_DEADLINE_NOW,
			}),
		).toBe("in_progress");
	});

	it("is a no-op on an already-closed status", () => {
		expect(
			applyDeclarationClosure({
				status: "closed_incomplete",
				fsmStatus: "corrective_actions_chosen",
				year: ROW_YEAR,
				currentYear: CURRENT_YEAR,
				deadlines: DEADLINES,
				now: PAST_DEADLINE_NOW,
			}),
		).toBe("closed_incomplete");
	});
});
