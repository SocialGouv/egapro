import { describe, expect, it } from "vitest";
import {
	type CompliancePathValue,
	DECLARATION_FSM_STATUSES,
	type DeclarationFsmStatus,
	isJointEvaluationWritable,
	isSecondDeclarationWritable,
} from "~/modules/domain";
import { getSubmissionBannerState } from "../submissionBanner";

function state(
	status: DeclarationFsmStatus,
	first: CompliancePathValue | null,
	second: CompliancePathValue | null,
	hasSubmittedSecondDeclaration: boolean,
) {
	return getSubmissionBannerState({
		status,
		firstDeclarationPathChoice: first,
		secondDeclarationPathChoice: second,
		hasSubmittedSecondDeclaration,
	});
}

const CSE_STEP_STATUSES = [
	"awaiting_cse_opinion",
	"demarche_completed",
] as const;

describe("getSubmissionBannerState", () => {
	it.each([
		[3, "joint_evaluation", null, false],
		[4, "joint_evaluation", null, false],
		[7, "corrective_action", "joint_evaluation", true],
		[8, "corrective_action", "joint_evaluation", true],
		[11, "corrective_action", "joint_evaluation", true],
		[12, "corrective_action", "joint_evaluation", true],
	] as const)("shows the joint evaluation banner for case %s", (_case, first, second, submitted) => {
		expect(
			state("awaiting_cse_opinion", first, second, submitted)?.variant,
		).toBe("joint_evaluation");
	});

	it.each([
		[5, null],
		[6, "justify"],
		[9, null],
		[10, "justify"],
	] as const)("shows the second declaration banner for case %s", (_case, second) => {
		expect(
			state("awaiting_cse_opinion", "corrective_action", second, true)?.variant,
		).toBe("second_declaration");
	});

	it.each([
		[1, null],
		[2, "justify"],
	] as const)("shows no banner for case %s", (_case, first) => {
		expect(state("awaiting_cse_opinion", first, null, false)).toBeNull();
	});

	it.each(
		CSE_STEP_STATUSES,
	)("keeps both deposits closed in %s with the current state machine", (status) => {
		expect(
			state(status, "joint_evaluation", null, false)?.depositModifiable,
		).toBe(false);
		expect(
			state(status, "corrective_action", null, true)?.depositModifiable,
		).toBe(false);
	});

	it.each(
		DECLARATION_FSM_STATUSES,
	)("follows the domain writability rules in %s", (status) => {
		expect(state(status, "joint_evaluation", null, false)).toEqual({
			variant: "joint_evaluation",
			depositModifiable: isJointEvaluationWritable(status),
		});
		expect(state(status, "corrective_action", null, true)).toEqual({
			variant: "second_declaration",
			depositModifiable: isSecondDeclarationWritable(status),
		});
	});
});
