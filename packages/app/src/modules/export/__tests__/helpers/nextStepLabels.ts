// Shared verbatim so both test suites cannot drift on the wording the SUIT contract promises.
export const STAGE_LABELS = {
	compliancePathChoice:
		"(1ère déclaration) Choix du parcours de mise en conformité",
	correctiveActions: "Actions correctives et seconde déclaration",
	revisionChoice: "(2e déclaration) Choix du parcours de mise en conformité",
	jointEvaluation: "Évaluation conjointe des rémunérations",
	cseOpinion: "Déposer le ou les avis CSE",
	completion: "Finalisation - Démarche des indicateurs de rémunération",
} as const;

export const GAP_PERSISTS_CONDITION = "si l'écart persiste (≥ 5 %)";
export const GAP_RESOLVED_CONDITION = "si l'écart est résorbé (< 5 %)";
