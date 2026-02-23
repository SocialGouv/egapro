import Link from "next/link";
import { NewTabNotice } from "../shared/NewTabNotice";

/** Footer body: Marianne logo, description, government links. */
export function FooterBody() {
	return (
		<div className="fr-footer__body">
			<div className="fr-footer__brand fr-enlarge-link">
				<Link
					href="/"
					title="Home - Egapro - Ministry of Labour and Solidarity"
				>
					<p className="fr-logo">
						Ministry
						<br />
						of labour
						<br />
						and solidarity
					</p>
				</Link>
			</div>
			<div className="fr-footer__content">
				<p className="fr-footer__content-desc">
					Egapro allows companies to declare their remuneration and
					representation indicators between women and men.
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
