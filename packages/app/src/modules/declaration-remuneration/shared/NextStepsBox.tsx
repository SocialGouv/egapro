"use client";

import { TrackedLink } from "~/modules/analytics";
import { NewTabNotice } from "~/modules/layout/shared/NewTabNotice";
import styles from "./NextStepsBox.module.scss";
import { UpdateCseModal } from "./UpdateCseModal";

type Props = {
	hasGapsAboveThreshold: boolean;
	siren: string;
	isSecondDeclaration?: boolean;
};

/** Shared "Prochaines étapes" box with CSE consultation info and gap warnings */
export function NextStepsBox({
	hasGapsAboveThreshold,
	siren,
	isSecondDeclaration,
}: Props) {
	return (
		<>
			<div className={styles.nextSteps}>
				<h3 className="fr-h4 fr-mb-0">Prochaines étapes</h3>

				<div className={styles.section}>
					<h4 className="fr-text--bold fr-text--md fr-mb-0">
						Informer et consulter le CSE
					</h4>

					<p className="fr-mb-0">
						Au cours du temps imparti pour réaliser votre déclaration, vous
						devez{" "}
						<strong>
							obligatoirement informer et consulter le CSE sur l&apos;exactitude
							des données déclarées
						</strong>
						.
					</p>

					<div className={styles.ctaGroup}>
						<p className="fr-mb-0">
							Le ou les avis du CSE devront être transmis sur le portail lors de
							la dernière étape.
						</p>
						<TrackedLink
							className="fr-link"
							href="/avis-cse"
							trackingId="cse_models"
						>
							Voir les modèles d&apos;avis CSE
						</TrackedLink>
						<button
							aria-controls="update-cse-modal"
							className="fr-btn fr-btn--secondary"
							data-fr-opened="false"
							type="button"
						>
							Mettre à jour l&apos;existence d&apos;un CSE
						</button>
					</div>
				</div>

				{hasGapsAboveThreshold && <hr className={styles.separator} />}

				{hasGapsAboveThreshold && (
					<div className={styles.section}>
						<div className={styles.alertHeader}>
							<p
								className={`fr-badge fr-badge--warning fr-badge--sm ${styles.alertBadge}`}
							>
								Écarts détectés
							</p>
							<h4 className="fr-text--bold fr-text--md fr-mb-0">
								Actions à engager
							</h4>
						</div>

						<p className="fr-mb-0">
							Suite à l&apos;analyse de vos données de l&apos;indicateur par
							catégorie de salariés, des écarts &ge; 5 % ont été identifiés.
							Vous devez engager un des parcours de mise en conformité
							suivant&nbsp;:
						</p>

						<ul>
							<li>
								<strong>
									Justifier les écarts par des critères objectifs et non
									sexistes.
								</strong>{" "}
								Si vous choisissez ce parcours, vous devez informer et consulter
								le CSE (avis à transmettre sur le portail lors de la dernière
								étape)
							</li>
						</ul>
						<p className="fr-mb-0">
							Si la justification n&apos;est pas possible par des critères
							objectifs et non sexistes, vous pouvez&nbsp;:
						</p>
						<ul>
							{!isSecondDeclaration && (
								<li>
									<strong>
										Mettre en place des actions correctives et effectuer une
										seconde déclaration dans un délai de 6 mois
									</strong>
								</li>
							)}
							<li>
								<strong>
									Réaliser une évaluation conjointe des rémunérations
								</strong>
							</li>
						</ul>
					</div>
				)}

				<hr className={styles.separator} />

				<div className={styles.section}>
					<h4 className="fr-text--bold fr-text--md fr-mb-0">Pour vous aider</h4>
					<ul className="fr-raw-list fr-links-group">
						<li>
							<TrackedLink
								className="fr-link"
								href="https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle"
								rel="noopener noreferrer"
								target="_blank"
								trackingId="objective_criteria"
							>
								Qu&apos;entend-on par critères objectifs et non sexistes ?
								<NewTabNotice />
							</TrackedLink>
						</li>
						<li>
							<TrackedLink
								className="fr-link"
								href="https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle"
								rel="noopener noreferrer"
								target="_blank"
								trackingId="corrective_actions"
							>
								En savoir plus sur actions correctives et seconde déclaration
								<NewTabNotice />
							</TrackedLink>
						</li>
						<li>
							<TrackedLink
								className="fr-link"
								href="https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle"
								rel="noopener noreferrer"
								target="_blank"
								trackingId="joint_evaluation"
							>
								En savoir plus sur évaluation conjointe des rémunérations
								<NewTabNotice />
							</TrackedLink>
						</li>
					</ul>
				</div>
			</div>

			<UpdateCseModal siren={siren} />
		</>
	);
}
