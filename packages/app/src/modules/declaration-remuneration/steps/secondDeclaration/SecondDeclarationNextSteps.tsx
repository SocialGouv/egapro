"use client";

import { TrackedLink } from "~/modules/analytics";
import styles from "~/modules/declaration-remuneration/shared/NextStepsBox.module.scss";
import { UpdateCseModal } from "~/modules/declaration-remuneration/shared/UpdateCseModal";
import { NewTabNotice } from "~/modules/layout/shared/NewTabNotice";

type Props = {
	cseApplicable: boolean;
	cseOpinionRequired: boolean;
	hasGapsAboveThreshold: boolean;
	siren: string;
};

export function SecondDeclarationNextSteps({
	cseApplicable,
	cseOpinionRequired,
	hasGapsAboveThreshold,
	siren,
}: Props) {
	return (
		<>
			<div className={styles.nextSteps}>
				{cseOpinionRequired && (
					<div className={styles.section}>
						<h2 className="fr-text--bold fr-text--md fr-mb-0">
							Rappel : Informer et consulter le CSE
						</h2>

						<p className="fr-mb-0">
							Avant de transmettre votre déclaration, vous devez{" "}
							<strong>
								obligatoirement informer et consulter le CSE sur
								l&apos;exactitude des données utilisées pour le calcul, la
								méthode de calcul et les résultats de chaque écart déclaré.
							</strong>
						</p>

						<div className={styles.ctaGroup}>
							<p className="fr-mb-0">
								L&apos;avis du CSE devra être transmis lors de la dernière étape
								de la démarche.
							</p>
							<p className="fr-mb-0">
								Les modèles d&apos;avis du CSE ne sont pas encore disponibles.
							</p>
							{cseApplicable && (
								<button
									aria-controls="update-cse-modal"
									className="fr-btn fr-btn--secondary"
									data-fr-opened="false"
									type="button"
								>
									Mettre à jour l&apos;existence d&apos;un CSE
								</button>
							)}
						</div>
					</div>
				)}

				{!cseOpinionRequired && cseApplicable && (
					<div className={styles.section}>
						<div className={styles.ctaGroup}>
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
				)}

				<hr className={styles.separator} />

				{hasGapsAboveThreshold && (
					<>
						<div className={styles.section}>
							<div className={styles.alertHeader}>
								<p
									className={`fr-badge fr-badge--warning fr-badge--sm ${styles.alertBadge}`}
								>
									Écarts détectés
								</p>
								<h2 className="fr-text--bold fr-text--md fr-mb-0">
									Prochaines étapes
								</h2>
							</div>

							<p className="fr-mb-0">
								À la suite de l&apos;analyse de vos données de l&apos;indicateur
								par catégorie d&apos;emplois, des écarts &ge; 5 % ont été
								identifiés&nbsp;:
							</p>

							<ul>
								<li className="fr-mb-4v">
									<strong>
										En cas de justification d&apos;au moins un écart par des
										critères objectifs et non fondés sur le sexe,
									</strong>{" "}
									vous devez informer et consulter le CSE sur cette
									justification
								</li>
								<li>
									<strong>
										En cas d&apos;absence de justification d&apos;au moins un
										écart
									</strong>
									, vous devrez mettre en place une évaluation conjointe des
									rémunérations
								</li>
							</ul>
						</div>

						<hr className={styles.separator} />
					</>
				)}

				<div className={styles.section}>
					<h2 className="fr-text--bold fr-text--md fr-mb-0">Pour vous aider</h2>
					<ul className="fr-raw-list fr-links-group">
						<li>
							<TrackedLink
								className="fr-link"
								href="https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle"
								rel="noopener noreferrer"
								target="_blank"
								trackingId="objective_criteria"
							>
								Qu&apos;entend-on par critères objectifs et non fondés sur le
								sexe ?
								<NewTabNotice />
							</TrackedLink>
						</li>
						{hasGapsAboveThreshold && (
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
						)}
					</ul>
				</div>
			</div>

			<UpdateCseModal cseApplicable={cseApplicable} siren={siren} />
		</>
	);
}
