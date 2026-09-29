"use client";

import { useLockContext } from "./LockContext";

export function DeclarationModificationClosedAlert() {
	const { reason } = useLockContext();
	if (reason !== "modification_closed") return null;

	return (
		<div
			className="fr-alert fr-alert--info fr-alert--sm fr-mb-3w"
			role="status"
		>
			<p>
				Votre déclaration n'est plus modifiable : une étape suivante de votre
				démarche a déjà été transmise (seconde déclaration, rapport d'évaluation
				conjointe ou avis du CSE). À titre d'information, vous pouvez consulter
				chaque étape en lecture seule.
			</p>
		</div>
	);
}
