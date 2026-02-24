import Link from "next/link";

import { auth } from "~/server/auth";
import { Navigation } from "./Navigation";

/**
 * Header menu: visible as nav bar on desktop, modal dialog on mobile.
 * DSFR JS manages role="dialog" and aria-modal dynamically on mobile open.
 */
export async function MobileMenu() {
	const session = await auth();

	return (
		<div className="fr-header__menu fr-modal" id="modal-menu">
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
								className="fr-btn fr-btn--tertiary-no-outline fr-icon-information-line fr-btn--icon-left"
								href="/faq"
							>
								Aide
							</Link>
						</li>
						<li>
							{session?.user ? (
								<Link
									className="fr-btn fr-icon-logout-box-r-line"
									href="/api/auth/signout"
								>
									{session.user.name ?? "Se déconnecter"}
									{session.user.name && (
										<span className="fr-sr-only"> - Se déconnecter</span>
									)}
								</Link>
							) : (
								<Link
									className="fr-btn fr-icon-account-circle-fill"
									href="/login"
								>
									Se connecter
								</Link>
							)}
						</li>
					</ul>
				</div>
				<Navigation />
			</div>
		</div>
	);
}
