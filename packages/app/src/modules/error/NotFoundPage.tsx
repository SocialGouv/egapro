import Link from "next/link";

import styles from "./ErrorImage.module.scss";

/** 404 Not Found page content following DSFR error page template. */
export function NotFoundPage() {
	return (
		<main id="content" tabIndex={-1}>
			<div className="fr-container">
				<div className="fr-my-7w fr-mt-md-12w fr-mb-md-10w fr-grid-row fr-grid-row--gutters fr-grid-row--middle fr-grid-row--center">
					<div className="fr-py-0 fr-col-12 fr-col-md-6">
						<h1>Page non trouvée</h1>
						<p className="fr-text--sm fr-mb-3w">Erreur 404</p>
						<p className="fr-text--lead fr-mb-3w">
							La page que vous cherchez est introuvable. Excusez-nous pour la
							gêne occasionnée.
						</p>
						<p className="fr-text--sm fr-mb-5w">
							Si vous avez tapé l&apos;adresse web dans le navigateur, vérifiez
							qu&apos;elle est correcte. La page n&apos;est peut-être plus
							disponible.
							<br />
							Dans ce cas, pour continuer votre visite vous pouvez consulter
							notre page d&apos;accueil.
						</p>
						<ul className="fr-btns-group fr-btns-group--inline-md">
							<li>
								<Link className="fr-btn" href="/">
									Page d&apos;accueil
								</Link>
							</li>
						</ul>
					</div>
					<div
						className={`fr-col-12 fr-col-md-4 fr-col-offset-md-1 fr-py-0 ${styles.container}`}
					>
						<img
							alt=""
							aria-hidden="true"
							className={styles.image}
							src="/assets/images/error/technical-error-illustration.svg"
						/>
					</div>
				</div>
			</div>
		</main>
	);
}
