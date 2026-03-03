import { AideCallout } from "./AideCallout";
import { AideResourceCards } from "./AideResourceCards";
import { AideTextesReference } from "./AideTextesReference";

/** Aide et ressources landing page. */
export function AidePage() {
	return (
		<main id="content" tabIndex={-1}>
			<div className="fr-container fr-py-6w">
				<nav aria-label="vous êtes ici :" className="fr-breadcrumb">
					<button
						aria-controls="breadcrumb-aide"
						aria-expanded="false"
						className="fr-breadcrumb__button"
						type="button"
					>
						Voir le fil d'Ariane
					</button>
					<div className="fr-collapse" id="breadcrumb-aide">
						<ol className="fr-breadcrumb__list">
							<li>
								<a className="fr-breadcrumb__link" href="/">
									Accueil
								</a>
							</li>
							<li>
								<a
									aria-current="page"
									className="fr-breadcrumb__link"
									href="/aide"
								>
									Aide et ressources
								</a>
							</li>
						</ol>
					</div>
				</nav>

				<a
					className="fr-link fr-icon-arrow-left-line fr-link--icon-left"
					href="/"
				>
					Retour
				</a>

				<h1 className="fr-h1 fr-mt-4w">Aide et ressources</h1>

				<div className="fr-mb-6w">
					<AideCallout />
				</div>

				<div className="fr-mb-6w">
					<AideResourceCards />
				</div>

				<div className="fr-mb-6w">
					<AideTextesReference />
				</div>

				<div aria-hidden="true" className="fr-grid-row fr-grid-row--center">
					<img
						alt=""
						height="147"
						src="/assets/images/aide/help-illustration.svg"
						width="210"
					/>
				</div>
			</div>
		</main>
	);
}
