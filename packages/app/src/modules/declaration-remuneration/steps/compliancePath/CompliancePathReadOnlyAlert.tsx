import type { CompliancePathReadOnlyReason } from "./constants";

const READ_ONLY_MESSAGES: Record<CompliancePathReadOnlyReason, string> = {
	demarche_completed:
		"Votre démarche est finalisée. Le choix du parcours ne peut plus être modifié.",
	cse_opinion_submitted:
		"L'avis du CSE a déjà été transmis. Le choix du parcours ne peut plus être modifié.",
	second_declaration_submitted:
		"La seconde déclaration a déjà été soumise. Le choix du parcours ne peut plus être modifié.",
	joint_evaluation_submitted:
		"Le rapport d'évaluation conjointe a déjà été transmis. Le choix du parcours ne peut plus être modifié.",
	modification_deadline_passed:
		"La date limite de modification de votre déclaration est dépassée. Le choix du parcours ne peut plus être modifié.",
};

export function CompliancePathReadOnlyAlert({
	reason,
}: {
	reason: CompliancePathReadOnlyReason;
}) {
	return (
		<div className="fr-alert fr-alert--info fr-alert--sm">
			<p>{READ_ONLY_MESSAGES[reason]}</p>
		</div>
	);
}
