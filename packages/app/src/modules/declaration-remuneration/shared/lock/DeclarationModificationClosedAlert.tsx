"use client";

import { OrdinalLongDate } from "../OrdinalLongDate";
import { useLockContext } from "./LockContext";

type DeclarationModificationClosedAlertProps = {
	deadline: Date;
};

export function DeclarationModificationClosedAlert({
	deadline,
}: DeclarationModificationClosedAlertProps) {
	const { reason } = useLockContext();
	if (reason !== "modification_closed") return null;

	return (
		<div className="fr-alert fr-alert--info fr-alert--sm fr-mb-3w">
			<p>
				Votre déclaration n'est plus modifiable — modification close depuis le{" "}
				<OrdinalLongDate date={deadline} />. Vous pouvez consulter chaque étape
				en lecture seule.
			</p>
		</div>
	);
}
