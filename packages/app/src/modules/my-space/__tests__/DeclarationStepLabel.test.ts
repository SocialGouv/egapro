import { describe, expect, it } from "vitest";
import { REPRESENTATION_STEPS } from "~/modules/declaration-representation";
import type { DeclarationFsmStatus, DeclarationStatus } from "~/modules/domain";

import { getDeclarationProcessStepLabel } from "../DeclarationStepLabel";

const REPRESENTATION_START_LABEL = "Vérification de l'assujettissement";

function remuneration(fsmStatus: DeclarationFsmStatus | null) {
	return {
		type: "remuneration" as const,
		fsmStatus,
		status: "in_progress" as DeclarationStatus,
		currentStep: 1,
	};
}

function representation(status: DeclarationStatus, currentStep: number) {
	return {
		type: "representation" as const,
		fsmStatus: null,
		status,
		currentStep,
	};
}

describe("getDeclarationProcessStepLabel", () => {
	it("returns the first remuneration step label when fsmStatus is null", () => {
		expect(getDeclarationProcessStepLabel(remuneration(null))).toBe(
			"Déclaration des indicateurs de rémunération",
		);
	});

	const cases: Array<{ fsm: DeclarationFsmStatus; label: string }> = [
		{ fsm: "draft", label: "Déclaration des indicateurs de rémunération" },
		{
			fsm: "awaiting_compliance_path_choice",
			label: "Choix du parcours de mise en conformité",
		},
		{
			fsm: "corrective_actions_chosen",
			label: "Actions correctives et seconde déclaration",
		},
		{
			fsm: "awaiting_revision_choice",
			label: "Choix du parcours de mise en conformité (Deuxième déclaration)",
		},
		{
			fsm: "joint_evaluation_chosen",
			label: "Évaluation conjointe des rémunérations",
		},
		{
			fsm: "revised_joint_evaluation_chosen",
			label: "Évaluation conjointe des rémunérations",
		},
		{ fsm: "awaiting_cse_opinion", label: "Déposer le ou les avis CSE" },
		{
			fsm: "demarche_completed",
			label: "Finalisation - Démarche des indicateurs de rémunération",
		},
	];

	for (const { fsm, label } of cases) {
		it(`returns "${label}" for fsmStatus="${fsm}"`, () => {
			expect(getDeclarationProcessStepLabel(remuneration(fsm))).toBe(label);
		});
	}

	describe("representation", () => {
		it("returns the subjection check for a démarche not started yet", () => {
			expect(
				getDeclarationProcessStepLabel(representation("to_complete", 0)),
			).toBe(REPRESENTATION_START_LABEL);
		});

		it("ignores the remuneration state machine even when fsmStatus is set", () => {
			expect(
				getDeclarationProcessStepLabel({
					...representation("to_complete", 0),
					fsmStatus: "demarche_completed",
				}),
			).toBe(REPRESENTATION_START_LABEL);
		});

		for (const [index, step] of REPRESENTATION_STEPS.entries()) {
			it(`returns "${step.title}" for a draft sitting on step ${index + 1}`, () => {
				expect(
					getDeclarationProcessStepLabel(
						representation("in_progress", index + 1),
					),
				).toBe(step.title);
			});
		}

		it("falls back to the subjection check when the draft step is out of range", () => {
			expect(
				getDeclarationProcessStepLabel(
					representation("in_progress", REPRESENTATION_STEPS.length + 1),
				),
			).toBe(REPRESENTATION_START_LABEL);
		});

		it("falls back to the subjection check when an in-progress draft has no step yet", () => {
			expect(
				getDeclarationProcessStepLabel(representation("in_progress", 0)),
			).toBe(REPRESENTATION_START_LABEL);
		});

		it("returns the completion label for a submitted démarche", () => {
			expect(getDeclarationProcessStepLabel(representation("done", 5))).toBe(
				"Finalisation - Démarche des indicateurs de représentation",
			);
		});
	});
});
