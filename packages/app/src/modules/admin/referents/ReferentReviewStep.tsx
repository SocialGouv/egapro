import type { Ref } from "react";

import type { ReferentChange } from "./referentChanges";

type Props = {
	changes: ReferentChange[];
	headingId: string;
	headingRef: Ref<HTMLHeadingElement>;
};

export function ReferentReviewStep({ changes, headingId, headingRef }: Props) {
	const hasChanges = changes.length > 0;

	return (
		<section aria-labelledby={headingId}>
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
					<ReferentChangesTable changes={changes} />
				</>
			)}
			{!hasChanges && (
				<p className="fr-mb-2w">
					Vous n'avez modifié aucune information : il n'y a rien à enregistrer.
				</p>
			)}
		</section>
	);
}

type ReferentChangesTableProps = {
	changes: ReferentChange[];
};

function ReferentChangesTable({ changes }: ReferentChangesTableProps) {
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

type ReviewActionsProps = {
	canConfirm: boolean;
	onBack: () => void;
	onCancel: () => void;
	onConfirm: () => void;
};

export function ReferentReviewActions({
	canConfirm,
	onBack,
	onCancel,
	onConfirm,
}: ReviewActionsProps) {
	return (
		<ul className="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg">
			{canConfirm && (
				<li>
					<button
						className="fr-btn fr-btn--primary"
						onClick={onConfirm}
						type="button"
					>
						Confirmer et enregistrer
					</button>
				</li>
			)}
			<li>
				<button
					className="fr-btn fr-btn--secondary"
					onClick={onBack}
					type="button"
				>
					Revenir aux champs
				</button>
			</li>
			<li>
				<button
					className="fr-btn fr-btn--tertiary"
					onClick={onCancel}
					type="button"
				>
					Annuler
				</button>
			</li>
		</ul>
	);
}
