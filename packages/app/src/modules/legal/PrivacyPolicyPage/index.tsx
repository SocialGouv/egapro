import { PrivacyCookies } from "./PrivacyCookies";
import { PrivacyOverview } from "./PrivacyOverview";
import { PrivacyRightsAndData } from "./PrivacyRightsAndData";

/** Données personnelles / politique de confidentialité page. */
export function PrivacyPolicyPage() {
	return (
		<main id="content" tabIndex={-1}>
			<div className="fr-container fr-py-6w">
				<nav aria-label="vous êtes ici :" className="fr-breadcrumb">
					<button
						aria-controls="breadcrumb-privacy"
						aria-expanded="false"
						className="fr-breadcrumb__button"
						type="button"
					>
						Voir le fil d'Ariane
					</button>
					<div className="fr-collapse" id="breadcrumb-privacy">
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
									href="/donnees-personnelles"
								>
									Données personnelles
								</a>
							</li>
						</ol>
					</div>
				</nav>

				<h1 className="fr-h1 fr-mt-4w">Données personnelles</h1>

				<PrivacyOverview />
				<PrivacyRightsAndData />
				<PrivacyCookies />
			</div>
		</main>
	);
}
