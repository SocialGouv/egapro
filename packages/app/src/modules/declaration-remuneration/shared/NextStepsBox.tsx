"use client";

import Link from "next/link";
import { NewTabNotice } from "~/modules/layout/shared/NewTabNotice";
import stepStyles from "../steps/Step6Review.module.scss";
import { UpdateCseModal } from "../steps/step6/UpdateCseModal";

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
			<div className={stepStyles.nextSteps}>
				<h3 className="fr-h4 fr-mb-0">Prochaines étapes</h3>

				<p className="fr-mb-0">
					Au cours du temps imparti pour réaliser votre déclaration, vous devez{" "}
					<strong>
						obligatoirement informer et consulter le CSE sur l&apos;exactitude
						des données déclarées
					</strong>
					.
				</p>

				<div>
					<p className="fr-mb-0">
						Le ou les avis du CSE devront être transmis sur le portail lors de
						la dernière étape.
					</p>
					<div className="fr-mt-1w">
						<button
							aria-controls="update-cse-modal"
							className={`fr-btn fr-btn--tertiary-no-outline fr-btn--sm ${stepStyles.buttonLink}`}
							data-fr-opened="false"
							type="button"
						>
							Mettre à jour la présence d&apos;un CSE
						</button>
						<Link className="fr-link fr-ml-2w" href="/avis-cse">
							Voir les modèles d&apos;avis CSE
						</Link>
					</div>
				</div>

				{hasGapsAboveThreshold && (
					<>
						<p className="fr-text--bold fr-mb-0">Des écarts ont été détectés</p>
						<p className="fr-mb-0">
							Suite à l&apos;analyse de vos données de l&apos;indicateur par
							catégorie de salariés,{" "}
							<strong>des écarts &ge; 5 % ont été identifiés</strong>. Vous
							devez engager un des parcours de mise en conformité suivant&nbsp;:
						</p>
						<ul className="fr-text--md">
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
						<ul className="fr-text--md">
							{!isSecondDeclaration && (
								<li>
									Mettre en place des actions correctives et effectuer une
									seconde déclaration dans un délai de 6 mois
								</li>
							)}
							<li>Réaliser une évaluation conjointe des rémunérations</li>
						</ul>
					</>
				)}

				<hr className={stepStyles.separator} />
				<p className="fr-text--bold fr-text--lg fr-mb-0">Pour vous aider</p>
				<ul className="fr-raw-list fr-links-group">
					<li>
						<a
							className="fr-link"
							href="https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle"
							rel="noopener noreferrer"
							target="_blank"
						>
							Qu&apos;entend-on par critères objectifs et non sexistes ?
							<NewTabNotice />
						</a>
					</li>
					<li>
						<a
							className="fr-link"
							href="https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle"
							rel="noopener noreferrer"
							target="_blank"
						>
							En savoir plus sur actions correctives et seconde déclaration
							<NewTabNotice />
						</a>
					</li>
					<li>
						<a
							className="fr-link"
							href="https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle"
							rel="noopener noreferrer"
							target="_blank"
						>
							En savoir plus sur évaluation conjointe des rémunérations
							<NewTabNotice />
						</a>
					</li>
				</ul>
			</div>

			<UpdateCseModal siren={siren} />
		</>
	);
}
