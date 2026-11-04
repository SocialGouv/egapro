import type { Ref } from "react";

import { ChangesTable } from "~/modules/shared";

import type { ProfileChange } from "./profileChanges";

export const PROFILE_REVIEW_TITLE_ID = "profile-review-title";

type Props = {
	changes: ProfileChange[];
	headingRef: Ref<HTMLHeadingElement>;
	hasSaveFailed: boolean;
};

export function ProfileReviewStep({
	changes,
	headingRef,
	hasSaveFailed,
}: Props) {
	const hasChanges = changes.length > 0;

	return (
		<section aria-labelledby={PROFILE_REVIEW_TITLE_ID}>
			<h3
				className="fr-h6 fr-mb-2w"
				id={PROFILE_REVIEW_TITLE_ID}
				ref={headingRef}
				tabIndex={-1}
			>
				Vérifier vos modifications
			</h3>
			{hasChanges && (
				<>
					<p className="fr-text--regular fr-mb-2w">
						Les informations suivantes remplaceront celles enregistrées dans
						votre profil. Rien n’est enregistré tant que vous n’avez pas
						confirmé.
					</p>
					<ChangesTable changes={changes} />
				</>
			)}
			{!hasChanges && (
				<p className="fr-text--regular fr-mb-2w">
					Vous n’avez modifié aucune information : il n’y a rien à enregistrer.
				</p>
			)}
			{hasSaveFailed && (
				<div className="fr-alert fr-alert--error fr-alert--sm" role="alert">
					<p>
						L’enregistrement de vos informations a échoué. Vos modifications
						sont conservées : vous pouvez réessayer.
					</p>
				</div>
			)}
		</section>
	);
}
