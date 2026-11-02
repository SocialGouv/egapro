import type { Ref } from "react";

import { formatCount } from "~/modules/domain";

type Props = {
	headingId: string;
	headingRef: Ref<HTMLHeadingElement>;
	fileName: string;
	existingCount: number;
	importedCount: number;
};

export function ImportReferentsConfirmStep({
	headingId,
	headingRef,
	fileName,
	existingCount,
	importedCount,
}: Props) {
	const deletedLabel =
		existingCount > 1
			? "référents existants seront supprimés"
			: "référent existant sera supprimé";
	const addedLabel =
		importedCount > 1 ? "référents seront ajoutés" : "référent sera ajouté";

	return (
		<section aria-labelledby={headingId}>
			<h3
				className="fr-h6 fr-mb-2w"
				id={headingId}
				ref={headingRef}
				tabIndex={-1}
			>
				Confirmer le remplacement des référents
			</h3>
			<p className="fr-mb-1w">
				Le fichier « {fileName} » est valide. Son import remplacera toute la
				liste actuelle :
			</p>
			<ul className="fr-mb-2w">
				<li>
					<strong>{formatCount(existingCount)}</strong> {deletedLabel} ;
				</li>
				<li>
					<strong>{formatCount(importedCount)}</strong> {addedLabel}.
				</li>
			</ul>
			<p className="fr-mb-0">
				Cette suppression est définitive. Pour pouvoir revenir en arrière,
				exportez la liste actuelle avant de confirmer. Rien n'est modifié tant
				que vous n'avez pas confirmé l'import.
			</p>
		</section>
	);
}
