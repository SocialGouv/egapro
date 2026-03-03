import { AccessibilityCompliance } from "./AccessibilityCompliance";
import { AccessibilityContact } from "./AccessibilityContact";
import { AccessibilityEstablishment } from "./AccessibilityEstablishment";

/** Déclaration d'accessibilité page (RGAA). */
export function AccessibilityPage() {
	return (
		<main id="content" tabIndex={-1}>
			<div className="fr-container fr-py-6w">
				<nav aria-label="vous êtes ici :" className="fr-breadcrumb">
					<button
						aria-controls="breadcrumb-accessibility"
						aria-expanded="false"
						className="fr-breadcrumb__button"
						type="button"
					>
						Voir le fil d'Ariane
					</button>
					<div className="fr-collapse" id="breadcrumb-accessibility">
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
									href="/declaration-accessibilite"
								>
									Déclaration d'accessibilité
								</a>
							</li>
						</ol>
					</div>
				</nav>

				<h1 className="fr-h1 fr-mt-4w">Déclaration d'accessibilité</h1>

				<p>
					La Direction générale du travail s'engage à rendre son service
					accessible, conformément à l'article 47 de la loi n° 2005-102 du 11
					février 2005.
				</p>

				<AccessibilityCompliance />
				<AccessibilityEstablishment />
				<AccessibilityContact />
			</div>
		</main>
	);
}
