import Link from "next/link";

/** Plan du site page. */
export function SitemapPage() {
	return (
		<main id="content" tabIndex={-1}>
			<div className="fr-container fr-py-6w">
				<nav aria-label="vous êtes ici :" className="fr-breadcrumb">
					<button
						aria-controls="breadcrumb-sitemap"
						aria-expanded="false"
						className="fr-breadcrumb__button"
						type="button"
					>
						Voir le fil d'Ariane
					</button>
					<div className="fr-collapse" id="breadcrumb-sitemap">
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
									href="/plan-du-site"
								>
									Plan du site
								</a>
							</li>
						</ol>
					</div>
				</nav>

				<h1 className="fr-h1 fr-mt-4w">Plan du site</h1>

				<nav aria-label="Plan du site">
					<ul className="fr-raw-list">
						<li className="fr-mb-2w">
							<Link className="fr-link" href="/">
								Accueil
							</Link>
						</li>
						<li className="fr-mb-2w">
							<Link className="fr-link" href="/aide">
								Aide et ressources
							</Link>
						</li>
						<li className="fr-mb-2w">
							<Link className="fr-link" href="/faq">
								Questions fréquentes (FAQ)
							</Link>
						</li>
						<li className="fr-mb-2w">
							<Link className="fr-link" href="/login">
								Connexion
							</Link>
						</li>
						<li className="fr-mb-2w">
							<span className="fr-h6">Pages légales</span>
							<ul className="fr-raw-list fr-ml-4w">
								<li className="fr-mb-2w">
									<Link className="fr-link" href="/mentions-legales">
										Mentions légales
									</Link>
								</li>
								<li className="fr-mb-2w">
									<Link className="fr-link" href="/donnees-personnelles">
										Données personnelles
									</Link>
								</li>
								<li className="fr-mb-2w">
									<Link className="fr-link" href="/gestion-des-cookies">
										Gestion des cookies
									</Link>
								</li>
								<li className="fr-mb-2w">
									<Link className="fr-link" href="/declaration-accessibilite">
										Déclaration d'accessibilité
									</Link>
								</li>
							</ul>
						</li>
					</ul>
				</nav>
			</div>
		</main>
	);
}
