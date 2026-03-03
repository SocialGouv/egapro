import Link from "next/link";

import { Breadcrumb } from "~/modules/layout";

/** Plan du site page. */
export function SitemapPage() {
	return (
		<main id="content" tabIndex={-1}>
			<div className="fr-container fr-py-6w">
				<Breadcrumb
					items={[{ label: "Accueil", href: "/" }, { label: "Plan du site" }]}
				/>

				<h1 className="fr-h1 fr-mt-4w">Plan du site</h1>

				<h2 className="fr-h4">Pages principales</h2>
				<ul className="fr-raw-list fr-mb-4w">
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
				</ul>

				<h2 className="fr-h4">Pages légales</h2>
				<ul className="fr-raw-list">
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
					<li className="fr-mb-2w">
						<Link className="fr-link" href="/plan-du-site">
							Plan du site
						</Link>
					</li>
				</ul>
			</div>
		</main>
	);
}
