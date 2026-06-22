import { STEP_TITLES } from "~/modules/declaration-remuneration/types";
import type { DeclarationEventType as DomainEventType } from "~/modules/domain";

export type DeclarationEventType = DomainEventType | "step_change";

export type HistoryEvent = {
	eventType: DeclarationEventType;
	value: string | null;
	round: number | null;
};

export type HistoryEventDisplay = {
	label: string;
	pageLabel: string | null;
	pageHref: string | null;
};

export function getHistoryEventDisplay(
	event: HistoryEvent,
): HistoryEventDisplay {
	switch (event.eventType) {
		case "step_change": {
			const round = event.round;
			if (round === null) {
				return {
					label: "Modification de la page",
					pageLabel: null,
					pageHref: null,
				};
			}
			const title = STEP_TITLES[round];
			if (title === undefined) {
				return {
					label: "Modification de la page",
					pageLabel: null,
					pageHref: null,
				};
			}
			return {
				label: "Modification de la page",
				pageLabel: title,
				pageHref: `/declaration-remuneration/etape/${round}`,
			};
		}
		case "submit":
			return {
				label: "Soumission de la déclaration",
				pageLabel: "Récapitulatif de votre déclaration",
				pageHref: "/declaration-remuneration/recapitulatif",
			};
		case "path_choice":
			return {
				label: "Choix du parcours de mise en conformité",
				pageLabel: "Parcours de mise en conformité",
				pageHref: "/declaration-remuneration/parcours-conformite",
			};
		case "second_declaration_submit":
			return {
				label: "Soumission de la seconde déclaration",
				pageLabel: "Parcours de mise en conformité",
				pageHref: "/declaration-remuneration/parcours-conformite",
			};
		case "joint_evaluation_submit":
			return {
				label: "Dépôt de l'évaluation conjointe",
				pageLabel: "Évaluation conjointe",
				pageHref:
					"/declaration-remuneration/parcours-conformite/evaluation-conjointe",
			};
		case "cse_opinion_submit":
			return {
				label: "Dépôt de l'avis CSE",
				pageLabel: "Avis CSE",
				pageHref: "/avis-cse",
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
				pageHref: "/declaration-remuneration/recapitulatif",
			};
		default: {
			const _exhaustive: never = event.eventType;
			throw new Error(`Unknown event type: ${String(_exhaustive)}`);
		}
	}
}
