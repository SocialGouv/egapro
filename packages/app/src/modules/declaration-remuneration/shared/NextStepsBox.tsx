"use client";

import { CseOpinionCtaGroup } from "./CseOpinionCtaGroup";
import { HelpLink } from "./HelpLink";
import styles from "./NextStepsBox.module.scss";
import { UpdateCseButton } from "./UpdateCseButton";
import { UpdateCseModal } from "./UpdateCseModal";

type Props = {
	cseApplicable: boolean;
	cseOpinionRequired: boolean;
	hasGapsAboveThreshold: boolean;
	siren: string;
};

/** Shared "Prochaines étapes" box with CSE consultation info and gap warnings */
export function NextStepsBox({
	cseApplicable,
	cseOpinionRequired,
	hasGapsAboveThreshold,
	siren,
}: Props) {
	return (
		<>
			<div className={styles.nextSteps}>
				<h3 className="fr-h4 fr-mb-0">Prochaines étapes</h3>

				{cseOpinionRequired && (
					<div className={styles.section}>
						<h4 className="fr-text--bold fr-text--md fr-mb-0">
							Informer et consulter le CSE
						</h4>

						<p className="fr-mb-0">
							Au cours du temps imparti pour réaliser votre déclaration, vous
							devez{" "}
							<strong>
								obligatoirement informer et consulter le CSE sur
								l&apos;exactitude des données déclarées
							</strong>
							.
						</p>

						<CseOpinionCtaGroup cseApplicable={cseApplicable} />
					</div>
				)}

				{!cseOpinionRequired && cseApplicable && (
					<div className={styles.section}>
						<div className={styles.ctaGroup}>
							<UpdateCseButton />
						</div>
					</div>
				)}

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
							À la suite de l&apos;analyse de vos données de l&apos;indicateur
							par catégorie d&apos;emplois, des écarts &ge; 5 % ont été
							identifiés. Vous devez engager un des parcours de mise en
							conformité suivant&nbsp;:
						</p>

						<ul>
							<li>
								<strong>
									Justifier les écarts par des critères objectifs et non
									sexistes.
								</strong>{" "}
								Si vous choisissez ce parcours, vous devez informer et consulter
								le CSE sur cette justification
								{cseOpinionRequired
									? " (avis à transmettre lors de la dernière étape de la démarche)."
									: "."}
							</li>
						</ul>
						<p className="fr-mb-0">
							Si la justification n&apos;est pas possible par des critères
							objectifs et non sexistes, vous pouvez&nbsp;:
						</p>
						<ul>
							<li>
								<strong>
									Soit mettre en place des actions correctives et effectuer une
									seconde déclaration dans un délai de 6 mois
								</strong>
							</li>
							<li>
								<strong>
									Soit réaliser une évaluation conjointe des rémunérations
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
							<HelpLink trackingId="objective_criteria">
								Qu&apos;entend-on par critères objectifs et non sexistes ?
							</HelpLink>
						</li>
						<li>
							<HelpLink trackingId="corrective_actions">
								En savoir plus sur actions correctives et seconde déclaration
							</HelpLink>
						</li>
						<li>
							<HelpLink trackingId="joint_evaluation">
								En savoir plus sur évaluation conjointe des rémunérations
							</HelpLink>
						</li>
					</ul>
				</div>
			</div>

			<UpdateCseModal cseApplicable={cseApplicable} siren={siren} />
		</>
	);
}
