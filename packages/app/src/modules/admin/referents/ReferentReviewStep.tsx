import type { Ref } from "react";

import { ChangesTable } from "~/modules/shared";

import type { ReferentChange } from "./referentChanges";

type Props = {
	changes: ReferentChange[];
	headingId: string;
	headingRef: Ref<HTMLHeadingElement>;
};

export function ReferentReviewStep({ changes, headingId, headingRef }: Props) {
	const hasChanges = changes.length > 0;

	return (
		<div>
			<h3
				className="fr-h6 fr-mb-2w"
				id={headingId}
				ref={headingRef}
				tabIndex={-1}
			>
				Vérifier les modifications
			</h3>
			{hasChanges && (
				<>
					<p className="fr-mb-2w">
						Les informations suivantes remplaceront celles enregistrées pour ce
						référent. Rien n'est enregistré tant que vous n'avez pas confirmé.
					</p>
					<ChangesTable changes={changes} />
				</>
			)}
			{!hasChanges && (
				<p className="fr-mb-2w">
					Vous n'avez modifié aucune information : il n'y a rien à enregistrer.
				</p>
			)}
		</div>
	);
}
