import { fireEvent, screen } from "@testing-library/react";
import type { ComponentProps } from "react";

import { getDefaultCampaignDeadlines } from "~/modules/domain";
import { CompliancePathChoice } from "../CompliancePathChoice";
import { PAGE_PATH } from "./compliancePathChoiceMocks";

export const ALL_TITLE =
	"Tous les écarts de rémunération ≥ 5 % sont justifiables";
export const PARTIAL_TITLE =
	"Une partie des écarts de rémunération ≥ 5 % est justifiable";
export const NONE_TITLE = "Aucun écart de rémunération ≥ 5 % n'est justifiable";
export const CORRECTIVE_ACTION_TITLE =
	"Effectuer des actions correctives et une seconde déclaration";
export const JOINT_EVALUATION_TITLE =
	"Mettre en place une évaluation conjointe des rémunérations";
export const COMPLIANCE_TITLE =
	/^Parcours de mise en conformité pour l'indicateur par catégorie\u00a0d'emplois$/;

export const JOINT_EVALUATION_HREF =
	"/declaration-remuneration/parcours-conformite/evaluation-conjointe";
export const CORRECTIVE_ACTION_HREF =
	"/declaration-remuneration/parcours-conformite/etape/1";
export const PATH_SCREEN_HREF = `${PAGE_PATH}?ecran=parcours`;

export function compliancePathChoice(
	overrides: Partial<ComponentProps<typeof CompliancePathChoice>> = {},
) {
	return (
		<CompliancePathChoice
			campaignDeadlines={getDefaultCampaignDeadlines(2026)}
			cseOpinionRequired={true}
			currentYear={2026}
			declarationModifiable={true}
			declarationSiren="123456789"
			declarationYear={2026}
			email="test@example.fr"
			{...overrides}
		/>
	);
}

export function submitForm() {
	const form = screen
		.getByRole("button", { name: /suivant/i })
		.closest("form") as HTMLFormElement;
	fireEvent.submit(form);
}
