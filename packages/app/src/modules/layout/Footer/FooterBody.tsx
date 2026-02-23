import Link from "next/link";
import { NewTabNotice } from "../shared/NewTabNotice";

/** Footer body: Marianne logo, description, government links. */
export function FooterBody() {
	return (
		<div className="fr-footer__body">
			<div className="fr-footer__brand fr-enlarge-link">
				<Link
					href="/"
					title="Accueil - Egapro - Ministère du Travail et des Solidarités"
				>
					<p className="fr-logo">
						Ministère
						<br />
						du travail
						<br />
						et des solidarités
					</p>
				</Link>
			</div>
			<div className="fr-footer__content">
				<p className="fr-footer__content-desc">
					Egapro permet aux entreprises de déclarer leurs indicateurs de
					rémunération et de représentation entre les femmes et les hommes.
				</p>
				<ul className="fr-footer__content-list">
					<li className="fr-footer__content-item">
						<a
							className="fr-footer__content-link"
							href="https://info.gouv.fr"
							rel="noopener noreferrer"
							target="_blank"
						>
							info.gouv.fr
							<NewTabNotice />
						</a>
					</li>
					<li className="fr-footer__content-item">
						<a
							className="fr-footer__content-link"
							href="https://service-public.fr"
							rel="noopener noreferrer"
							target="_blank"
						>
							service-public.fr
							<NewTabNotice />
						</a>
					</li>
					<li className="fr-footer__content-item">
						<a
							className="fr-footer__content-link"
							href="https://legifrance.gouv.fr"
							rel="noopener noreferrer"
							target="_blank"
						>
							legifrance.gouv.fr
							<NewTabNotice />
						</a>
					</li>
					<li className="fr-footer__content-item">
						<a
							className="fr-footer__content-link"
							href="https://data.gouv.fr"
							rel="noopener noreferrer"
							target="_blank"
						>
							data.gouv.fr
							<NewTabNotice />
						</a>
					</li>
				</ul>
			</div>
		</div>
	);
}
