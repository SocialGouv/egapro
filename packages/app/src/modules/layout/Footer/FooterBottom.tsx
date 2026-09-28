import Link from "next/link";
import {
	ACCESSIBILITY,
	COOKIES,
	LEGAL_NOTICE,
	PRIVACY,
	SITE_MAP,
} from "~/modules/routes";
import { NewTabNotice } from "../shared/NewTabNotice";
import { AppVersion } from "./AppVersion";

/** Footer bottom bar: legal links, display settings, license. */
export function FooterBottom() {
	return (
		<div className="fr-footer__bottom">
			<ul className="fr-footer__bottom-list">
				<li className="fr-footer__bottom-item">
					<Link className="fr-footer__bottom-link" href={ACCESSIBILITY}>
						Accessibilité : partiellement conforme
					</Link>
				</li>
				<li className="fr-footer__bottom-item">
					<Link className="fr-footer__bottom-link" href={LEGAL_NOTICE}>
						Mentions légales
					</Link>
				</li>
				<li className="fr-footer__bottom-item">
					<Link className="fr-footer__bottom-link" href={PRIVACY}>
						Données personnelles
					</Link>
				</li>
				<li className="fr-footer__bottom-item">
					<Link className="fr-footer__bottom-link" href={COOKIES}>
						Gestion des cookies
					</Link>
				</li>
				<li className="fr-footer__bottom-item">
					<Link className="fr-footer__bottom-link" href={SITE_MAP}>
						Plan du site
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
				<AppVersion />
			</ul>
			<div className="fr-footer__bottom-copy">
				<p>
					Sauf mention contraire, tout le contenu de ce site est sous{" "}
					<a
						href="https://github.com/etalab/licence-ouverte/blob/master/LO.md"
						rel="noopener noreferrer"
						target="_blank"
					>
						licence etalab-2.0
						<NewTabNotice />
					</a>
				</p>
			</div>
		</div>
	);
}
