import { formatMinutes } from "~/modules/domain";
import { formatLockHolderIdentity } from "./lockHolderIdentity";
import type { LockAlertFollowUp, LockHolderDisplay } from "./types";

type DeclarationLockAlertProps = {
	holder: LockHolderDisplay;
	followUp: LockAlertFollowUp;
};

const FOLLOW_UP_TEXT: Record<LockAlertFollowUp, string> = {
	watchThenRetake:
		"Cette page vérifie automatiquement si la déclaration se libère : vous pourrez alors passer en modification.",
	watchThenAutoEdit:
		"Cette page vérifie automatiquement si la déclaration se libère et passera alors en modification.",
	openToWatch:
		"Ouvrez la déclaration pour être prévenu dès qu'elle sera libérée.",
	refreshToCheck:
		"Actualisez la page pour vérifier si elle est de nouveau modifiable.",
};

export function DeclarationLockAlert({
	holder,
	followUp,
}: DeclarationLockAlertProps) {
	const identity = formatLockHolderIdentity(holder) ?? "Un autre utilisateur";
	const timeout = formatMinutes(holder.lockTimeoutMinutes);

	return (
		<div className="fr-alert fr-alert--warning fr-mb-3w" role="alert">
			{/* The alert renders above the page <h1> in every host page (tunnel
			    layouts, my-space panel), so its title must stay out of the heading
			    outline (RGAA 9.1) — the DSFR class keeps the visual unchanged. */}
			<p className="fr-alert__title">Déclaration en cours de modification</p>
			<p>
				{`${identity} modifie actuellement cette déclaration. Vous pouvez la consulter en lecture seule.`}
			</p>
			<p>
				{`Elle sera de nouveau modifiable dès que cette personne fermera sa page ou se déconnectera, et au plus tard ${timeout} après qu'elle aura quitté la déclaration. Tant qu'elle la garde ouverte, aucune heure de fin ne peut être annoncée.`}
			</p>
			<p>{FOLLOW_UP_TEXT[followUp]}</p>
		</div>
	);
}
