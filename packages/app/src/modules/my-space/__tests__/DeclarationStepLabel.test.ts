import { describe, expect, it } from "vitest";
import type { DeclarationFsmStatus } from "~/modules/domain";

import { getDeclarationProcessStepLabel } from "../DeclarationStepLabel";

describe("getDeclarationProcessStepLabel", () => {
	it("returns 'Non commencée' when fsmStatus is null", () => {
		expect(getDeclarationProcessStepLabel(null)).toBe("Non commencée");
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
			expect(getDeclarationProcessStepLabel(fsm)).toBe(label);
		});
	}
});
