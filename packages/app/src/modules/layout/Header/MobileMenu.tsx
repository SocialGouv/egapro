import Link from "next/link";
import { Navigation } from "./Navigation";

/**
 * Modale de navigation mobile.
 * Ouverte via le bouton #fr-btn-menu-mobile, gérée par le JS DSFR.
 * role="dialog" est requis pour que aria-label soit valide sur un <div>.
 */
export function MobileMenu() {
	return (
		<div
			aria-label="Menu"
			aria-modal="true"
			className="fr-header__menu fr-modal"
			id="modal-menu"
			role="dialog"
		>
			<div className="fr-container">
				<button
					aria-controls="modal-menu"
					className="fr-link--close fr-link"
					type="button"
				>
					Fermer
				</button>
				<div className="fr-header__menu-links">
					<ul className="fr-btns-group">
						<li>
							<Link
								className="fr-btn fr-icon-account-circle-line"
								href="/login"
							>
								Se connecter
							</Link>
						</li>
					</ul>
				</div>
				<Navigation />
			</div>
		</div>
	);
}
