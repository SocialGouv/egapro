import { DsfrPictogram } from "~/modules/layout";

import styles from "./ArchivesSection.module.scss";

export function ArchivesSection() {
	return (
		<div className="fr-container fr-mb-6w">
			<div className={styles.card}>
				<div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
					<div className="fr-col-auto">
						<DsfrPictogram
							path="/dsfr/artwork/pictograms/document/archive.svg"
							size={80}
						/>
					</div>
					<div className="fr-col">
						<p className="fr-text--bold fr-mb-1v">Archives</p>
						<p className="fr-text--sm fr-mb-0">
							Récupérer vos anciennes déclarations de l'index de l'égalité
							professionnelle femmes-hommes.
						</p>
					</div>
					<div className="fr-col-auto">
						<button
							className="fr-btn fr-btn--tertiary"
							disabled
							title="Fonctionnalité à venir"
							type="button"
						>
							Demander une déclaration archivée
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
