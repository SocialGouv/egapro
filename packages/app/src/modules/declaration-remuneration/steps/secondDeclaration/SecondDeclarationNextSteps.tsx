"use client";

import { CseOpinionCtaGroup } from "~/modules/declaration-remuneration/shared/CseOpinionCtaGroup";
import { HelpLink } from "~/modules/declaration-remuneration/shared/HelpLink";
import styles from "~/modules/declaration-remuneration/shared/NextStepsBox.module.scss";
import { UpdateCseButton } from "~/modules/declaration-remuneration/shared/UpdateCseButton";
import { UpdateCseModal } from "~/modules/declaration-remuneration/shared/UpdateCseModal";

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
								<li className="fr-mb-3v">
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
							<HelpLink trackingId="objective_criteria">
								Qu&apos;entend-on par critères objectifs et non fondés sur le
								sexe ?
							</HelpLink>
						</li>
						{hasGapsAboveThreshold && (
							<li>
								<HelpLink trackingId="joint_evaluation">
									En savoir plus sur évaluation conjointe des rémunérations
								</HelpLink>
							</li>
						)}
					</ul>
				</div>
			</div>

			<UpdateCseModal cseApplicable={cseApplicable} siren={siren} />
		</>
	);
}
