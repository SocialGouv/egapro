import Link from "next/link";
import { NewTabNotice } from "../shared/NewTabNotice";

/** Section liens du haut du footer : liens utiles et liens ministère. */
export function FooterTopLinks() {
	return (
		<div className="fr-footer__top">
			<div className="fr-container">
				<div className="fr-grid-row fr-grid-row--gutters fr-grid-row--start">
					<div className="fr-col-12 fr-col-sm-3 fr-col-md-2">
						<h3 className="fr-footer__top-cat">Liens utiles</h3>
						<ul className="fr-footer__top-list">
							<li>
								<Link className="fr-footer__top-link" href="/aide-index">
									Aide pour l'index
								</Link>
							</li>
							<li>
								<Link className="fr-footer__top-link" href="/aide-proconnect">
									Aide pour ProConnect
								</Link>
							</li>
							<li>
								<Link className="fr-footer__top-link" href="/stats">
									Statistiques
								</Link>
							</li>
							<li>
								<a
									className="fr-footer__top-link"
									href="https://github.com/SocialGouv/egapro"
									rel="noopener noreferrer"
									target="_blank"
								>
									Contribuer sur GitHub
									<NewTabNotice />
								</a>
							</li>
						</ul>
					</div>
					<div className="fr-col-12 fr-col-sm-3 fr-col-md-2">
						<h3 className="fr-footer__top-cat">Ministère du Travail</h3>
						<ul className="fr-footer__top-list">
							<li>
								<a
									className="fr-footer__top-link"
									href="https://travail-emploi.gouv.fr"
									rel="noopener noreferrer"
									target="_blank"
								>
									Site du ministère (Index)
									<NewTabNotice />
								</a>
							</li>
							<li>
								<a
									className="fr-footer__top-link"
									href="https://travail-emploi.gouv.fr"
									rel="noopener noreferrer"
									target="_blank"
								>
									Site du ministère (Représentation)
									<NewTabNotice />
								</a>
							</li>
							<li>
								<a
									className="fr-footer__top-link"
									href="mailto:index@travail.gouv.fr"
								>
									index@travail.gouv.fr
								</a>
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
}
