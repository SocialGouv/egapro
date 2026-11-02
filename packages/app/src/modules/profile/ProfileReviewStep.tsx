import type { Ref } from "react";

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
					<ProfileChangesTable changes={changes} />
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

function ProfileChangesTable({ changes }: { changes: ProfileChange[] }) {
	return (
		<div className="fr-table fr-table--bordered fr-mb-2w">
			<div className="fr-table__wrapper">
				<div className="fr-table__container">
					<div className="fr-table__content">
						<table>
							<caption className="fr-sr-only">
								Modifications à confirmer
							</caption>
							<thead>
								<tr>
									<th scope="col">Information</th>
									<th scope="col">Valeur actuelle</th>
									<th scope="col">Nouvelle valeur</th>
								</tr>
							</thead>
							<tbody>
								{changes.map((change) => (
									<tr key={change.field}>
										<th scope="row">{change.label}</th>
										<td>{change.previous}</td>
										<td>{change.next}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}
