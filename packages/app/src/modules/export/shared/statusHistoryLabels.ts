export const DECLARATION_EVENT_TYPE_LABELS = {
	submit: "Soumission de la déclaration",
	path_choice: "Choix du parcours",
	second_declaration_submit: "Soumission de la seconde déclaration",
	joint_evaluation_submit: "Dépôt du rapport d'évaluation conjointe",
	cse_opinion_submit: "Dépôt d'un avis CSE",
	cancel: "Annulation de la déclaration",
	demarche_complete: "Démarche terminée",
} as const;

export const PATH_CHOICE_VALUE_LABELS = {
	justify: "Justification de l'écart",
	corrective_action: "Actions correctives",
	joint_evaluation: "Évaluation conjointe",
} as const;

export type DeclarationEventType = keyof typeof DECLARATION_EVENT_TYPE_LABELS;

export function getStatusHistoryLabel(
	eventType: DeclarationEventType,
	value: string | null,
): string {
	if (eventType === "path_choice") {
		if (value !== null && value in PATH_CHOICE_VALUE_LABELS) {
			return `Choix du parcours — ${PATH_CHOICE_VALUE_LABELS[value as keyof typeof PATH_CHOICE_VALUE_LABELS]}`;
		}
		return DECLARATION_EVENT_TYPE_LABELS.path_choice;
	}
	return DECLARATION_EVENT_TYPE_LABELS[eventType];
}
