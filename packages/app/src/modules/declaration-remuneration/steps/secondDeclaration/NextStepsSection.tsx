import { NewTabNotice } from "~/modules/layout/shared/NewTabNotice";

type Props = {
	hasGapsAboveThreshold: boolean;
};

export function NextStepsSection({ hasGapsAboveThreshold }: Props) {
	return (
		<div className="fr-callout">
			<h3 className="fr-callout__title">Prochaines étapes</h3>
			<div className="fr-callout__text">
				<p>
					Au cours du temps imparti pour réaliser votre déclaration, vous devez{" "}
					<strong>obligatoirement</strong> informer et consulter le CSE sur
					l&apos;exactitude des données déclarées.
				</p>
				<p>
					Le ou les avis du CSE devront être transmis sur le portail lors de la
					dernière étape.
				</p>

				{hasGapsAboveThreshold && <GapsDetectedWarning />}

				<HelpLinks />
			</div>
		</div>
	);
}

function GapsDetectedWarning() {
	return (
		<>
			<p className="fr-text--bold">Des écarts ont été de nouveau détectés</p>
			<p>
				Suite à l&apos;analyse de vos données de l&apos;indicateur par catégorie
				de salariés, <strong>des écarts ≥ 5 % ont été identifiés</strong>. Vous
				devez <strong>engager un parcours de mise en conformité</strong> suivant
				:
			</p>
			<ul>
				<li>
					<strong>
						Justifier les écarts par des critères objectifs et non sexistes.
					</strong>{" "}
					Si vous choisissez ce parcours, vous devez informer et consulter le
					CSE (avis à transmettre lors de la dernière étape).
				</li>
			</ul>
			<p>
				Si la justification n&apos;est pas possible par des critères objectifs
				et non sexistes, vous pouvez :
			</p>
			<ul>
				<li>Réaliser une évaluation conjointe des rémunérations</li>
			</ul>
		</>
	);
}

function HelpLinks() {
	return (
		<>
			<p className="fr-text--bold fr-mt-3w">Pour vous aider</p>
			<ul className="fr-raw-list">
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
		</>
	);
}
