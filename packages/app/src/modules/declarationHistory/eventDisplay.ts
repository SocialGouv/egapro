import { STEP_TITLES } from "~/modules/declaration-remuneration/types";
import type { DeclarationEventType as DomainEventType } from "~/modules/domain";
import {
	COMPLIANCE_JOINT_EVALUATION,
	COMPLIANCE_PATH,
	CSE_OPINION,
	DECLARATION_REMUNERATION_RECAP,
	remunerationStepHref,
	toRemunerationStep,
} from "~/modules/routes";

export type DeclarationEventType = DomainEventType | "step_change";

export type HistoryEvent = {
	eventType: DeclarationEventType;
	value: string | null;
	round: number | null;
};

export type HistoryEventDisplay = ReturnType<typeof getHistoryEventDisplay>;

const PAGE_EDIT_LABEL = "Modification de la page";

const UNLINKED_PAGE_EDIT = {
	label: PAGE_EDIT_LABEL,
	pageLabel: null,
	pageHref: null,
} as const;

export function getHistoryEventDisplay(event: HistoryEvent) {
	switch (event.eventType) {
		case "step_change": {
			const round = event.round;
			if (round === null) {
				return UNLINKED_PAGE_EDIT;
			}
			const title = STEP_TITLES[round];
			if (title === undefined) {
				return UNLINKED_PAGE_EDIT;
			}
			// `STEP_TITLES[0]` is the funnel introduction, which lives at the entry
			// page — there is no `/etape/0`, and the route `notFound()`s below 1.
			// Naming the page without linking it is the honest rendering.
			const step = toRemunerationStep(round);
			return {
				label: PAGE_EDIT_LABEL,
				pageLabel: title,
				pageHref: step === null ? null : remunerationStepHref(step),
			};
		}
		case "submit":
			return {
				label: "Soumission de la déclaration",
				pageLabel: "Récapitulatif de votre déclaration",
				pageHref: DECLARATION_REMUNERATION_RECAP,
			};
		case "path_choice":
			return {
				label: "Choix du parcours de mise en conformité",
				pageLabel: "Parcours de mise en conformité",
				pageHref: COMPLIANCE_PATH,
			};
		case "second_declaration_submit":
			return {
				label: "Soumission de la seconde déclaration",
				pageLabel: "Parcours de mise en conformité",
				pageHref: COMPLIANCE_PATH,
			};
		case "joint_evaluation_submit":
			return {
				label: "Dépôt de l'évaluation conjointe",
				pageLabel: "Évaluation conjointe",
				pageHref: COMPLIANCE_JOINT_EVALUATION,
			};
		case "cse_opinion_submit":
			return {
				label: "Dépôt de l'avis CSE",
				pageLabel: "Avis CSE",
				pageHref: CSE_OPINION,
			};
		case "cancel":
			return {
				label: "Annulation de la déclaration",
				pageLabel: null,
				pageHref: null,
			};
		case "demarche_complete":
			return {
				label: "Démarche finalisée",
				pageLabel: "Démarche finalisée",
				pageHref: DECLARATION_REMUNERATION_RECAP,
			};
		default: {
			const _exhaustive: never = event.eventType;
			throw new Error(`Unknown event type: ${String(_exhaustive)}`);
		}
	}
}
