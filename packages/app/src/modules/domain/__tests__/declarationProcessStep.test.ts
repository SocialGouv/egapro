import { describe, expect, it } from "vitest";

import { getDefaultCampaignDeadlines } from "../shared/campaign";
import { getDeclarationProcessStepDeadline } from "../shared/declarationProcessStep";
import type { DeclarationFsmStatus } from "../types";

const YEAR = 2027;
const deadlines = getDefaultCampaignDeadlines(YEAR);

describe("getDeclarationProcessStepDeadline", () => {
	it("returns decl1ModificationDeadline when fsmStatus is null", () => {
		expect(getDeclarationProcessStepDeadline(null, deadlines)).toEqual(
			deadlines.decl1ModificationDeadline,
		);
	});

	it("returns null for demarche_completed (Clôturée)", () => {
		expect(
			getDeclarationProcessStepDeadline("demarche_completed", deadlines),
		).toBeNull();
	});

	const cases: Array<{
		fsm: Exclude<DeclarationFsmStatus, "demarche_completed">;
		deadlineKey: keyof typeof deadlines;
	}> = [
		{ fsm: "draft", deadlineKey: "decl1ModificationDeadline" },
		{
			fsm: "awaiting_compliance_path_choice",
			deadlineKey: "decl2ModificationDeadline",
		},
		{
			fsm: "corrective_actions_chosen",
			deadlineKey: "decl2ModificationDeadline",
		},
		{
			fsm: "awaiting_revision_choice",
			deadlineKey: "decl2JointEvaluationDeadline",
		},
		{
			fsm: "joint_evaluation_chosen",
			deadlineKey: "decl1JointEvaluationDeadline",
		},
		{
			fsm: "revised_joint_evaluation_chosen",
			deadlineKey: "decl2JointEvaluationDeadline",
		},
		{
			fsm: "awaiting_cse_opinion",
			deadlineKey: "decl2JointEvaluationDeadline",
		},
	];

	for (const { fsm, deadlineKey } of cases) {
		it(`returns ${deadlineKey} for fsmStatus="${fsm}"`, () => {
			expect(getDeclarationProcessStepDeadline(fsm, deadlines)).toEqual(
				deadlines[deadlineKey],
			);
		});
	}
});
