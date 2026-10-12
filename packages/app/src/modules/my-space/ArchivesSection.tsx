import { env } from "~/env.js";
import { DsfrPictogram, NewTabNotice } from "~/modules/layout";

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
						<h2 className="fr-text--md fr-mb-1w">Archives</h2>
						<p className="fr-text--sm fr-mb-0">
							Récupérer vos anciennes déclarations de l'index de l'égalité
							professionnelle femmes-hommes.
						</p>
					</div>
					<div className="fr-col-auto">
						<a
							className="fr-btn fr-btn--tertiary"
							href={env.SUPPORT_JIRA_URL}
							rel="noopener noreferrer"
							target="_blank"
						>
							Demander une déclaration archivée
							<NewTabNotice />
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}
