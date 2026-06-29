export const STATUS_LABELS: Record<string, string> = {
	draft: "Brouillon",
	awaiting_compliance_path_choice: "Transmise",
	corrective_actions_chosen: "Actions correctives choisies",
	joint_evaluation_chosen: "Évaluation conjointe choisie",
	awaiting_revision_choice: "Révision en attente",
	revised_joint_evaluation_chosen: "Révision évaluation conjointe",
	awaiting_cse_opinion: "Avis CSE en attente",
	demarche_completed: "Démarche terminée",
	cancelled: "Annulée",
};

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
