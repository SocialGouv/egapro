import { describe, expect, it, vi } from "vitest";

import {
	GAP_PERSISTS_CONDITION,
	GAP_RESOLVED_CONDITION,
	STAGE_LABELS,
} from "~/modules/export/__tests__/helpers/nextStepLabels";
import type { Rules } from "~/server/rules/engine";
import { loadRulesWithFallback } from "~/server/rules/nextSteps";
import type { Predicate } from "~/server/rules/schema";
import { buildNextStepsPayload } from "../nextStepsPayload";

// Substituting the ruleset is the only way to reach rendering branches the bundled 2027.1 never produces.
vi.mock("~/server/rules/nextSteps", async (importOriginal) => {
	const actual =
		await importOriginal<typeof import("~/server/rules/nextSteps")>();
	return {
		...actual,
		loadRulesWithFallback: vi.fn(actual.loadRulesWithFallback),
	};
});

type PayloadInput = Parameters<typeof buildNextStepsPayload>[0];

function stepsFor(overrides: Partial<PayloadInput> = {}) {
	return buildNextStepsPayload({
		status: "awaiting_compliance_path_choice",
		rulesVersion: "2027.1",
		cseRequired: true,
		cancelled: false,
		...overrides,
	});
}

describe("buildNextStepsPayload — ruleset 2027.1", () => {
	it("offers the three compliance paths of a CSE-bound company, none conditional (S3)", () => {
		const steps = stepsFor({ status: "awaiting_compliance_path_choice" });

		expect(steps).toEqual([
			{
				Identifiant_transition: "choose_path_initial_justify_with_cse",
				Action: "choose_compliance_path",
				Etat_cible: "awaiting_cse_opinion",
				Libelle: STAGE_LABELS.cseOpinion,
			},
			{
				Identifiant_transition: "choose_path_initial_corrective_action",
				Action: "choose_compliance_path",
				Etat_cible: "corrective_actions_chosen",
				Libelle: STAGE_LABELS.correctiveActions,
			},
			{
				Identifiant_transition: "choose_path_initial_joint_evaluation",
				Action: "choose_compliance_path",
				Etat_cible: "joint_evaluation_chosen",
				Libelle: STAGE_LABELS.jointEvaluation,
			},
		]);
	});

	it("omits the Condition key entirely on a decided guard rather than setting it undefined (S3)", () => {
		for (const step of stepsFor({
			status: "awaiting_compliance_path_choice",
		})) {
			expect(step).not.toHaveProperty("Condition");
		}
	});

	it("drops the without-CSE variant when the CSE opinion is required (S3)", () => {
		expect(
			stepsFor({ status: "awaiting_compliance_path_choice" }).map(
				(step) => step.Identifiant_transition,
			),
		).not.toContain("choose_path_initial_justify_without_cse");
	});

	it("splits the second declaration on the gap that is not known yet (S4)", () => {
		const steps = stepsFor({ status: "corrective_actions_chosen" });

		expect(steps).toEqual([
			{
				Identifiant_transition: "submit_second_declaration_persistent_gap",
				Action: "submit_second_declaration",
				Etat_cible: "awaiting_revision_choice",
				Libelle: STAGE_LABELS.revisionChoice,
				Condition: GAP_PERSISTS_CONDITION,
			},
			{
				Identifiant_transition: "submit_second_declaration_resolved_with_cse",
				Action: "submit_second_declaration",
				Etat_cible: "awaiting_cse_opinion",
				Libelle: STAGE_LABELS.cseOpinion,
				Condition: GAP_RESOLVED_CONDITION,
			},
		]);
	});

	it("drops the resolved-without-CSE variant, decided false by the known CSE fact (S4)", () => {
		expect(
			stepsFor({ status: "corrective_actions_chosen" }).map(
				(step) => step.Identifiant_transition,
			),
		).not.toContain("submit_second_declaration_resolved_without_cse");
	});

	it("labels a step with the stage of the target state, not of the current one (S4)", () => {
		const [persistentGap] = stepsFor({ status: "corrective_actions_chosen" });

		expect(persistentGap?.Libelle).toBe(STAGE_LABELS.revisionChoice);
		expect(persistentGap?.Libelle).not.toBe(STAGE_LABELS.correctiveActions);
	});

	it.each([
		"draft",
		"awaiting_compliance_path_choice",
		"corrective_actions_chosen",
		"demarche_completed",
	] as const)("returns no step at all for a cancelled %s declaration (S5)", (status) => {
		expect(stepsFor({ status, cancelled: true })).toEqual([]);
	});

	it("still offers the CSE opinion once the démarche is completed (S6)", () => {
		const steps = stepsFor({ status: "demarche_completed" });

		expect(steps).toEqual([
			{
				Identifiant_transition: "submit_cse_opinion",
				Action: "submit_cse_opinion",
				Etat_cible: "demarche_completed",
				Libelle: STAGE_LABELS.completion,
			},
		]);
	});

	it("renders a composite residual with a parenthesised composite child and a bare leaf", () => {
		expect(stepsFor({ status: "draft" })).toEqual([
			{
				Identifiant_transition: "submit_to_compliance_path_choice",
				Action: "submit",
				Etat_cible: "awaiting_compliance_path_choice",
				Libelle: STAGE_LABELS.compliancePathChoice,
				Condition: "si phase2Required",
			},
			{
				Identifiant_transition: "submit_to_cse_opinion_directly",
				Action: "submit",
				Etat_cible: "awaiting_cse_opinion",
				Libelle: STAGE_LABELS.cseOpinion,
				Condition: "si (non (phase2Required)) et cseRequired",
			},
			{
				Identifiant_transition: "submit_to_demarche_completed_directly",
				Action: "submit",
				Etat_cible: "demarche_completed",
				Libelle: STAGE_LABELS.completion,
				Condition: "si (non (phase2Required)) et (non (cseRequired))",
			},
		]);
	});
});

describe("buildNextStepsPayload — unknown rules version (S7)", () => {
	const reference = stepsFor({ status: "corrective_actions_chosen" });

	it.each([
		null,
		"9999.9",
	])("falls back on 2027.1 for the version %s without throwing", (rulesVersion) => {
		expect(() =>
			stepsFor({ status: "corrective_actions_chosen", rulesVersion }),
		).not.toThrow();
		expect(
			stepsFor({ status: "corrective_actions_chosen", rulesVersion }),
		).toEqual(reference);
	});
});

describe("buildNextStepsPayload — rendering of a substituted ruleset", () => {
	const undecidedGuard: Predicate = {
		all: [
			{
				all: [
					{ fact: "cseOpinionAt", op: "isNull" },
					{ fact: "jointEvaluationAt", op: "isNotNull" },
				],
			},
			{
				any: [
					{ fact: "gap", op: ">", value: 10 },
					{ fact: "workforce", op: ">=", threshold: "phase2SizeMin" },
				],
			},
			{ fact: "firstPath", op: "==", value: "justify" },
			{ fact: "secondPath", op: "!=", value: "joint_evaluation" },
			{ fact: "action.stillHasGap", op: "!=", value: true },
			{ fact: "action.stillHasGap", op: "==", value: null },
		],
	};

	const renderingRules: Rules = {
		version: "test",
		thresholds: { gapAlertPercent: 5, phase2SizeMin: 100 },
		stages: [{ id: 1, name: "Étape nommée" }],
		states: [
			{ id: "draft", stage: 1 },
			{ id: "awaiting_cse_opinion", stage: null },
			{ id: "demarche_completed", stage: 99 },
		],
		transitions: [
			{
				id: "render_residual",
				from: ["draft"],
				action: "probe",
				to: "draft",
				guard: undecidedGuard,
				events: [],
			},
			{
				id: "target_state_without_stage",
				from: ["draft"],
				action: "probe",
				to: "awaiting_cse_opinion",
				events: [],
			},
			{
				id: "target_stage_absent_from_stages",
				from: ["draft"],
				action: "probe",
				to: "demarche_completed",
				events: [],
			},
			{
				id: "target_state_absent_from_states",
				from: ["draft"],
				action: "probe",
				to: "corrective_actions_chosen",
				events: [],
			},
		],
	};

	function substitutedSteps() {
		vi.mocked(loadRulesWithFallback).mockReturnValueOnce(renderingRules);
		return stepsFor({ status: "draft" });
	}

	it("renders every residual node kind, parenthesising the composite children only", () => {
		const [residual] = substitutedSteps();

		expect(residual?.Condition).toBe(
			"si (cseOpinionAt est nul et jointEvaluationAt est renseigné) et (gap > 10 ou workforce >= 100) et firstPath = justify et secondPath ≠ joint_evaluation et action.stillHasGap ≠ true et action.stillHasGap = null",
		);
	});

	it("labels a step null when the target state carries no stage", () => {
		expect(
			substitutedSteps().find(
				(step) => step.Identifiant_transition === "target_state_without_stage",
			)?.Libelle,
		).toBeNull();
	});

	it("labels a step null when the stage of the target state is not declared", () => {
		expect(
			substitutedSteps().find(
				(step) =>
					step.Identifiant_transition === "target_stage_absent_from_stages",
			)?.Libelle,
		).toBeNull();
	});

	it("labels a step null when the target state itself is not declared", () => {
		expect(
			substitutedSteps().find(
				(step) =>
					step.Identifiant_transition === "target_state_absent_from_states",
			)?.Libelle,
		).toBeNull();
	});

	// 2027.1 pins gapAlertPercent at 5, so only a shifted threshold proves the seuil is interpolated.
	const shiftedThresholdRules: Rules = {
		...renderingRules,
		thresholds: { gapAlertPercent: 8, phase2SizeMin: 100 },
		transitions: [
			{
				id: "persistent_gap",
				from: ["draft"],
				action: "probe",
				to: "draft",
				guard: { fact: "action.stillHasGap", op: "==", value: true },
				events: [],
			},
			{
				id: "resolved_gap",
				from: ["draft"],
				action: "probe",
				to: "draft",
				guard: { fact: "action.stillHasGap", op: "==", value: false },
				events: [],
			},
		],
	};

	it.each([
		["persistent_gap", "si l'écart persiste (≥ 8 %)"],
		["resolved_gap", "si l'écart est résorbé (< 8 %)"],
	])("interpolates the gap threshold of the ruleset into %s", (id, condition) => {
		vi.mocked(loadRulesWithFallback).mockReturnValueOnce(shiftedThresholdRules);

		expect(
			stepsFor({ status: "draft" }).find(
				(step) => step.Identifiant_transition === id,
			)?.Condition,
		).toBe(condition);
	});
});
