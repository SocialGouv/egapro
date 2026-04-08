import Link from "next/link";

import { auth } from "~/server/auth";
import { MobileUserMenu } from "./MobileUserMenu";
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
								href="/aide"
							>
								Aide
							</Link>
						</li>
						{!session?.user && (
							<li>
								<Link
									className="fr-btn fr-btn--secondary fr-icon-account-circle-fill"
									href="/login"
								>
									Se connecter
								</Link>
							</li>
						)}
					</ul>
					{session?.user && (
						<MobileUserMenu
							userEmail={session.user.email ?? ""}
							userName={session.user.name ?? "Utilisateur"}
							userPhone={session.user.phone ?? undefined}
						/>
					)}
				</div>
				{!session?.user && <Navigation />}
			</div>
		</div>
	);
}
