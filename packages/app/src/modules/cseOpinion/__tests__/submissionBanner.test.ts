import { describe, expect, it } from "vitest";
import {
	type CompliancePathValue,
	DECLARATION_FSM_STATUSES,
	type DeclarationFsmStatus,
	isJointEvaluationWritable,
	isSecondDeclarationWritable,
	type LastTransmission,
} from "~/modules/domain";
import { getSubmissionBannerState } from "../submissionBanner";

function state(
	status: DeclarationFsmStatus,
	first: CompliancePathValue | null,
	second: CompliancePathValue | null,
	hasSubmittedSecondDeclaration: boolean,
	lastTransmission: LastTransmission | null = null,
) {
	return getSubmissionBannerState({
		status,
		firstDeclarationPathChoice: first,
		secondDeclarationPathChoice: second,
		hasSubmittedSecondDeclaration,
		lastTransmission,
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

	it.each<{
		label: string;
		first: CompliancePathValue | null;
		second: CompliancePathValue | null;
		submitted: boolean;
		lastTransmission: LastTransmission;
		modifiable: boolean;
	}>([
		{
			label: "the joint evaluation report",
			first: "joint_evaluation",
			second: null,
			submitted: false,
			lastTransmission: "joint_evaluation",
			modifiable: true,
		},
		{
			label: "the second declaration without a remaining gap",
			first: "corrective_action",
			second: null,
			submitted: true,
			lastTransmission: "second_declaration",
			modifiable: true,
		},
		{
			label: "the second declaration followed by justify",
			first: "corrective_action",
			second: "justify",
			submitted: true,
			lastTransmission: "path_choice_round_2",
			modifiable: false,
		},
	])("keeps $label modifiable only while it is the last transmission", ({
		first,
		second,
		submitted,
		lastTransmission,
		modifiable,
	}) => {
		expect(
			state("awaiting_cse_opinion", first, second, submitted, lastTransmission)
				?.depositModifiable,
		).toBe(modifiable);
	});

	it.each(
		CSE_STEP_STATUSES,
	)("keeps both deposits closed in %s with no transmission history", (status) => {
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
		const lastTransmission: LastTransmission = "joint_evaluation";
		expect(
			state(status, "joint_evaluation", null, false, lastTransmission),
		).toEqual({
			variant: "joint_evaluation",
			depositModifiable: isJointEvaluationWritable(status, lastTransmission),
		});

		const secondLastTransmission: LastTransmission = "second_declaration";
		expect(
			state(status, "corrective_action", null, true, secondLastTransmission),
		).toEqual({
			variant: "second_declaration",
			depositModifiable: isSecondDeclarationWritable(
				status,
				secondLastTransmission,
			),
		});
	});
});
