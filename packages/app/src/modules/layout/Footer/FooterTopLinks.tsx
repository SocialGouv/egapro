import Link from "next/link";
import { NewTabNotice } from "../shared/NewTabNotice";

/** Footer top links section: useful links and ministry links. */
export function FooterTopLinks() {
	return (
		<div className="fr-footer__top">
			<div className="fr-container">
				<div className="fr-grid-row fr-grid-row--gutters fr-grid-row--start">
					<div className="fr-col-12 fr-col-sm-3 fr-col-md-2">
						<h3 className="fr-footer__top-cat">Useful links</h3>
						<ul className="fr-footer__top-list">
							<li>
								<Link className="fr-footer__top-link" href="/aide-index">
									Help for index
								</Link>
							</li>
							<li>
								<Link className="fr-footer__top-link" href="/aide-proconnect">
									Help for ProConnect
								</Link>
							</li>
							<li>
								<Link className="fr-footer__top-link" href="/stats">
									Statistics
								</Link>
							</li>
							<li>
								<a
									className="fr-footer__top-link"
									href="https://github.com/SocialGouv/egapro"
									rel="noopener noreferrer"
									target="_blank"
								>
									Contribute on GitHub
									<NewTabNotice />
								</a>
							</li>
						</ul>
					</div>
					<div className="fr-col-12 fr-col-sm-3 fr-col-md-2">
						<h3 className="fr-footer__top-cat">Ministry of Labour</h3>
						<ul className="fr-footer__top-list">
							<li>
								<a
									className="fr-footer__top-link"
									href="https://travail-emploi.gouv.fr"
									rel="noopener noreferrer"
									target="_blank"
								>
									Ministry website (Index)
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
									Ministry website (Representation)
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
