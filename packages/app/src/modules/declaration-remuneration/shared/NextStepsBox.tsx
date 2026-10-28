"use client";

import { TrackedLink } from "~/modules/analytics";
import { NewTabNotice } from "~/modules/layout/shared/NewTabNotice";
import styles from "./NextStepsBox.module.scss";
import { UpdateCseModal } from "./UpdateCseModal";

type Props = {
	cseApplicable: boolean;
	cseOpinionRequired: boolean;
	hasGapsAboveThreshold: boolean;
	siren: string;
	isSecondDeclaration?: boolean;
};

/** Shared "Prochaines étapes" box with CSE consultation info and gap warnings */
export function NextStepsBox({
	cseApplicable,
	cseOpinionRequired,
	hasGapsAboveThreshold,
	siren,
	isSecondDeclaration,
}: Props) {
	const SectionHeading = isSecondDeclaration ? "h3" : "h4";

	return (
		<>
			<div className={styles.nextSteps}>
				{!isSecondDeclaration && (
					<h3 className="fr-h4 fr-mb-0">Prochaines étapes</h3>
				)}

				{cseOpinionRequired && (
					<div className={styles.section}>
						<SectionHeading className="fr-text--bold fr-text--md fr-mb-0">
							{isSecondDeclaration
								? "Rappel : informer et consulter le CSE"
								: "Informer et consulter le CSE"}
						</SectionHeading>

						<CseConsultationText isSecondDeclaration={isSecondDeclaration} />

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

				{hasGapsAboveThreshold && <hr className={styles.separator} />}

				{hasGapsAboveThreshold && (
					<div className={styles.section}>
						<div className={styles.alertHeader}>
							<p
								className={`fr-badge fr-badge--warning fr-badge--sm ${styles.alertBadge}`}
							>
								Écarts détectés
							</p>
							<SectionHeading className="fr-text--bold fr-text--md fr-mb-0">
								{isSecondDeclaration
									? "Prochaines étapes"
									: "Actions à engager"}
							</SectionHeading>
						</div>

						{isSecondDeclaration ? (
							<SecondDeclarationGapActions />
						) : (
							<FirstDeclarationGapActions
								cseOpinionRequired={cseOpinionRequired}
							/>
						)}
					</div>
				)}

				<hr className={styles.separator} />

				<div className={styles.section}>
					<SectionHeading className="fr-text--bold fr-text--md fr-mb-0">
						Pour vous aider
					</SectionHeading>
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
						{!isSecondDeclaration && (
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
						)}
						{(!isSecondDeclaration || hasGapsAboveThreshold) && (
							<li>
								<TrackedLink
									className="fr-link"
									href="https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle"
									rel="noopener noreferrer"
									target="_blank"
									trackingId="joint_evaluation"
								>
									En savoir plus sur l&apos;évaluation conjointe des
									rémunérations
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

function CseConsultationText({
	isSecondDeclaration,
}: {
	isSecondDeclaration?: boolean;
}) {
	if (isSecondDeclaration) {
		return (
			<p className="fr-mb-0">
				Avant de transmettre votre déclaration, vous devez{" "}
				<strong>
					obligatoirement informer et consulter le CSE sur l&apos;exactitude des
					données utilisées pour le calcul, la méthode de calcul et les
					résultats de chaque écart déclaré.
				</strong>
			</p>
		);
	}
	return (
		<p className="fr-mb-0">
			Au cours du temps imparti pour réaliser votre déclaration, vous devez{" "}
			<strong>
				obligatoirement informer et consulter le CSE sur l&apos;exactitude des
				données déclarées
			</strong>
			.
		</p>
	);
}

function SecondDeclarationGapActions() {
	return (
		<>
			<p className="fr-mb-0">
				À la suite de l&apos;analyse de vos données de l&apos;indicateur par
				catégorie d&apos;emplois, des écarts &ge; 5 % ont été identifiés&nbsp;:
			</p>
			<ul>
				<li>
					<strong>
						En cas de justification d&apos;au moins un écart par des critères
						objectifs et non fondés sur le sexe,
					</strong>{" "}
					vous devez informer et consulter le CSE sur cette justification
				</li>
				<li className="fr-mt-3v">
					<strong>
						En cas d&apos;absence de justification d&apos;au moins un écart
					</strong>
					, vous devrez mettre en place une évaluation conjointe des
					rémunérations
				</li>
			</ul>
		</>
	);
}

function FirstDeclarationGapActions({
	cseOpinionRequired,
}: {
	cseOpinionRequired: boolean;
}) {
	return (
		<>
			<p className="fr-mb-0">
				À la suite de l&apos;analyse de vos données de l&apos;indicateur par
				catégorie d&apos;emplois, des écarts &ge; 5 % ont été identifiés. Vous
				devez engager un des parcours de mise en conformité suivant&nbsp;:
			</p>
			<ul>
				<li>
					<strong>
						Justifier les écarts par des critères objectifs et non fondés sur le
						sexe.
					</strong>{" "}
					Si vous choisissez ce parcours, vous devez informer et consulter le
					CSE sur cette justification
					{cseOpinionRequired
						? " (avis à transmettre lors de la dernière étape de la démarche)."
						: "."}
				</li>
			</ul>
			<p className="fr-mb-0">
				Si la justification n&apos;est pas possible par des critères objectifs
				et non fondés sur le sexe, vous pouvez&nbsp;:
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
		</>
	);
}
