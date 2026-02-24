import Link from "next/link";
import { NewTabNotice } from "../shared/NewTabNotice";

/** Footer bottom bar: legal links, display settings, license. */
export function FooterBottom() {
	return (
		<div className="fr-footer__bottom">
			<ul className="fr-footer__bottom-list">
				<li className="fr-footer__bottom-item">
					<Link
						className="fr-footer__bottom-link"
						href="/declaration-accessibilite"
					>
						Accessibilité : partiellement conforme
					</Link>
				</li>
				<li className="fr-footer__bottom-item">
					<Link className="fr-footer__bottom-link" href="/mentions-legales">
						Mentions légales
					</Link>
				</li>
				<li className="fr-footer__bottom-item">
					<Link className="fr-footer__bottom-link" href="/cgu">
						CGU
					</Link>
				</li>
				<li className="fr-footer__bottom-item">
					<Link
						className="fr-footer__bottom-link"
						href="/politique-de-confidentialite-v2"
					>
						Politique de confidentialité
					</Link>
				</li>
				<li className="fr-footer__bottom-item">
					<button
						aria-controls="fr-theme-modal"
						className="fr-footer__bottom-link fr-icon-theme-fill fr-btn--icon-left"
						data-fr-opened="false"
						type="button"
					>
						Paramètres d'affichage
					</button>
				</li>
			</ul>
			<div className="fr-footer__bottom-copy">
				<p>
					Sauf mention contraire, tout le contenu de ce site est sous{" "}
					<a
						href="https://github.com/etalab/licence-ouverte/blob/master/LO.md"
						rel="noopener noreferrer"
						target="_blank"
					>
						licence Apache 2.0
						<NewTabNotice />
					</a>
				</p>
			</div>
		</div>
	);
}
