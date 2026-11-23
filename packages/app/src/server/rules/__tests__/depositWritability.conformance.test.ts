import { describe, expect, it } from "vitest";
import {
	isJointEvaluationWritable,
	isLockedBySubsequentSubmission,
	isSecondDeclarationWritable,
	LAST_TRANSMISSIONS,
	type LastTransmission,
	type SubsequentSubmissions,
} from "~/modules/domain";
import { canApplyAction, type Facts, loadRules } from "../engine";

const STATUS = "awaiting_cse_opinion";

const rules = loadRules("2027.1");

function facts(
	lastTransmission: LastTransmission,
	overrides: Partial<Facts> = {},
): Facts {
	return {
		currentState: STATUS,
		workforce: 120,
		indicatorGCalculated: false,
		gap: 2,
		hasCse: true,
		cseRequired: true,
		year: 2027,
		isTriennialYear: true,
		lastTransmission,
		...overrides,
	};
}

function submissionsFor(
	lastTransmission: LastTransmission,
): SubsequentSubmissions {
	return {
		hasSubmittedSecondDeclaration: lastTransmission === "second_declaration",
		secondDeclarationSubmissionCount:
			lastTransmission === "second_declaration" ? 1 : 0,
		hasSubmittedJointEvaluation: lastTransmission === "joint_evaluation",
		hasSubmittedRound1JointEvaluation: false,
		hasSubmittedCseOpinion: lastTransmission === "cse_opinion",
	};
}

describe("deposit writability mirrors the pre-CSE revisions of the ruleset (#4982)", () => {
	it.each([
		1, 2,
	] as const)("round %i: the joint evaluation is writable exactly when the engine re-accepts its report", (round) => {
		for (const lastTransmission of LAST_TRANSMISSIONS) {
			expect(
				canApplyAction(
					facts(lastTransmission, { action: { round } }),
					"submit_joint_evaluation",
					rules,
				),
				`joint evaluation round ${round} / ${lastTransmission}`,
			).toBe(isJointEvaluationWritable(STATUS, lastTransmission));
		}
	});

	it("the second declaration is writable exactly when the engine re-accepts it", () => {
		for (const lastTransmission of LAST_TRANSMISSIONS) {
			expect(
				canApplyAction(
					facts(lastTransmission, { action: { stillHasGap: false } }),
					"submit_second_declaration",
					rules,
				),
				`second declaration / ${lastTransmission}`,
			).toBe(isSecondDeclarationWritable(STATUS, lastTransmission));
		}
	});

	// `path_choice_*` are left out on purpose: Mon espace still offers "Modifier" on
	// a first declaration that only a path choice superseded, while re-transmitting
	// it is refused. That gap is tracked outside #4982.
	it.each([
		"first_declaration",
		"second_declaration",
		"joint_evaluation",
		"cse_opinion",
	] as const)("the first declaration is re-accepted exactly when it is not superseded (%s)", (lastTransmission) => {
		expect(
			canApplyAction(facts(lastTransmission), "submit", rules),
			`first declaration / ${lastTransmission}`,
		).toBe(
			!isLockedBySubsequentSubmission(
				submissionsFor(lastTransmission),
				"first_declaration",
			),
		);
	});
});
