import Link from "next/link";

import { auth } from "~/server/auth";
import { Navigation } from "./Navigation";
import { UserAccountMenu } from "./UserAccountMenu";

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
								<UserAccountMenu
									userEmail={session.user.email ?? ""}
									userName={session.user.name ?? "Utilisateur"}
									userPhone={session.user.phone ?? undefined}
								/>
							) : (
								<Link
									className="fr-btn fr-btn--secondary fr-icon-account-circle-fill"
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
