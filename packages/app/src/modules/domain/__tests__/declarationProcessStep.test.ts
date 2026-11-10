import { describe, expect, it } from "vitest";

import { getDefaultCampaignDeadlines } from "../shared/campaign";
import { civilDate } from "../shared/civilDate";
import {
	DECLARATION_PROCESS_STEP_LABELS,
	getDeclarationProcessStepDeadline,
} from "../shared/declarationProcessStep";
import { DECLARATION_FSM_STATUSES, type DeclarationFsmStatus } from "../types";

const YEAR = 2027;
// decl2ModificationDeadline, pathChoiceDeadline and decl2JointEvaluationDeadline all default to January 1st N+1: give each a distinct date so a case below cannot pass by picking the wrong key.
const deadlines = {
	...getDefaultCampaignDeadlines(YEAR),
	decl2ModificationDeadline: civilDate(YEAR + 1, 0, 2),
	pathChoiceDeadline: civilDate(YEAR + 1, 0, 3),
	decl2JointEvaluationDeadline: civilDate(YEAR + 1, 0, 4),
};

describe("getDeclarationProcessStepDeadline", () => {
	it("returns decl1ModificationDeadline when fsmStatus is null", () => {
		expect(getDeclarationProcessStepDeadline(null, deadlines)).toEqual(
			deadlines.decl1ModificationDeadline,
		);
	});

	it("returns null for demarche_completed (no deadline applies)", () => {
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
			deadlineKey: "pathChoiceRound1Deadline",
		},
		{
			fsm: "corrective_actions_chosen",
			deadlineKey: "decl2ModificationDeadline",
		},
		{
			fsm: "awaiting_revision_choice",
			deadlineKey: "pathChoiceDeadline",
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
			deadlineKey: "decl2CseOpinionDeadline",
		},
	];

	it("keeps the round-2 joint evaluation and CSE opinion fixtures distinct, so neither case below can pass by accident", () => {
		expect(deadlines.decl2JointEvaluationDeadline).not.toEqual(
			deadlines.decl2CseOpinionDeadline,
		);
	});

	for (const { fsm, deadlineKey } of cases) {
		it(`returns ${deadlineKey} for fsmStatus="${fsm}"`, () => {
			expect(getDeclarationProcessStepDeadline(fsm, deadlines)).toEqual(
				deadlines[deadlineKey],
			);
		});
	}
});

describe("DECLARATION_PROCESS_STEP_LABELS", () => {
	it("labels every engine state", () => {
		expect(Object.keys(DECLARATION_PROCESS_STEP_LABELS).sort()).toEqual(
			[...DECLARATION_FSM_STATUSES].sort(),
		);
		for (const status of DECLARATION_FSM_STATUSES) {
			expect(DECLARATION_PROCESS_STEP_LABELS[status]).not.toBe("");
		}
	});

	it("names the first step of a démarche after the remuneration declaration", () => {
		expect(DECLARATION_PROCESS_STEP_LABELS.draft).toBe(
			"Déclaration des indicateurs de rémunération",
		);
	});
});
