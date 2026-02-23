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
						Accessibility: partially compliant
					</Link>
				</li>
				<li className="fr-footer__bottom-item">
					<Link className="fr-footer__bottom-link" href="/mentions-legales">
						Legal notices
					</Link>
				</li>
				<li className="fr-footer__bottom-item">
					<Link className="fr-footer__bottom-link" href="/donnees-personnelles">
						Personal data
					</Link>
				</li>
				<li className="fr-footer__bottom-item">
					<Link className="fr-footer__bottom-link" href="/gestion-des-cookies">
						Cookie management
					</Link>
				</li>
				<li className="fr-footer__bottom-item">
					<Link className="fr-footer__bottom-link" href="/plan-du-site">
						Site map
					</Link>
				</li>
				<li className="fr-footer__bottom-item">
					<button
						aria-controls="fr-theme-modal"
						className="fr-footer__bottom-link fr-icon-theme-fill fr-btn--icon-left"
						data-fr-opened="false"
						type="button"
					>
						Display settings
					</button>
				</li>
			</ul>
			<div className="fr-footer__bottom-copy">
				<p>
					Unless otherwise stated, all content on this site is under{" "}
					<a
						href="https://github.com/etalab/licence-ouverte/blob/master/LO.md"
						rel="noopener noreferrer"
						target="_blank"
					>
						etalab-2.0 license
						<NewTabNotice />
					</a>
				</p>
			</div>
		</div>
	);
}
