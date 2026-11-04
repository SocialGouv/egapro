import {
	type DeclarationFsmStatus,
	type DemarcheLifecycleStatus,
	getDropoffPhaseLabel,
} from "~/modules/domain";

export const WORKFORCE_LABEL = "Effectif annuel moyen";

export const DEMARCHE_STATUS_COLUMN_LABEL = "Statut de la démarche";
export const LAST_TRANSMITTED_STEP_COLUMN_LABEL = "Dernière étape transmise";
export const NEXT_STEP_COLUMN_LABEL = "Prochaine étape";
export const STATUS_DATE_COLUMN_LABEL = "Date";

export const DEMARCHE_STATUS_LABELS: Record<DemarcheLifecycleStatus, string> = {
	draft: "Brouillon",
	in_progress: "En cours",
	completed: "Finalisée",
	cancelled: "Annulée",
};

export const DEMARCHE_STATUS_BADGE_CLASSES: Record<
	DemarcheLifecycleStatus,
	string
> = {
	draft: "",
	in_progress: "fr-badge--info",
	completed: "fr-badge--success",
	cancelled: "fr-badge--warning",
};

export const DEMARCHE_STATUS_HELP =
	"Brouillon : démarche ouverte, rien n'a encore été transmis. En cours : la première déclaration a été transmise, la démarche n'est pas terminée. Finalisée : démarche terminée. Annulée : démarche annulée par un administrateur.";
export const LAST_TRANSMITTED_STEP_HELP =
	"Dernière étape effectivement transmise par l'entreprise : déclaration, choix du parcours, seconde déclaration, évaluation conjointe ou avis du CSE.";
export const NEXT_STEP_HELP =
	"Étape que l'entreprise doit encore réaliser. Aucune lorsque la démarche est finalisée ou annulée.";
export const STATUS_DATE_HELP =
	"Brouillon : date d'ouverture de la démarche. En cours : date de la dernière étape transmise. Finalisée : date de finalisation. Annulée : date d'annulation.";

export function columnHelpLabel(columnLabel: string): string {
	return `Aide sur la colonne ${columnLabel}`;
}

export const STATUS_LABELS: Record<DeclarationFsmStatus, string> = {
	draft: "Brouillon",
	awaiting_compliance_path_choice: getDropoffPhaseLabel(
		"awaiting_compliance_path_choice",
	),
	corrective_actions_chosen: "Actions correctives choisies",
	joint_evaluation_chosen: "Évaluation conjointe choisie",
	awaiting_revision_choice: "Révision en attente",
	revised_joint_evaluation_chosen: "Révision évaluation conjointe",
	awaiting_cse_opinion: "Avis CSE en attente",
	demarche_completed: "Démarche terminée",
};

const LABEL_BY_STATUS: Readonly<Record<string, string>> = STATUS_LABELS;

export function statusLabel(
	status: string | null | undefined,
): string | null | undefined {
	return status ? (LABEL_BY_STATUS[status] ?? status) : status;
}

export const CANCEL_DECLARATION_BUTTON_LABEL = "Annuler la déclaration";
export const CANCEL_DECLARATION_MODAL_TITLE = "Confirmer l'annulation";
export const CANCEL_DECLARATION_MODAL_BODY =
	"Cette action ne peut être annulée. La déclaration sera transmise à l'API SUIT comme annulée et l'entreprise pourra redéposer une nouvelle déclaration pour cette année.";
export const CANCEL_DECLARATION_CONFIRM_LABEL = "Confirmer l'annulation";

export const UNLOCK_DECLARATION_BUTTON_LABEL = "Déverrouiller la déclaration";
export const UNLOCK_DECLARATION_MODAL_TITLE = "Confirmer le déverrouillage";
export const UNLOCK_DECLARATION_MODAL_BODY =
	"Le verrou d'édition sera supprimé immédiatement. L'utilisateur qui édite actuellement la déclaration pourra perdre ses modifications non sauvegardées.";
export const UNLOCK_DECLARATION_CONFIRM_LABEL = "Confirmer le déverrouillage";
