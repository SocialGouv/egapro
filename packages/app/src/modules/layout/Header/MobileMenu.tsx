import { auth } from "~/server/auth";
import { HeaderQuickAccessLinks } from "./HeaderQuickAccessLinks";
import { Navigation } from "./Navigation";

/**
 * Header menu: visible as nav bar on desktop, modal dialog on mobile.
 * DSFR JS manages role="dialog" and aria-modal dynamically on mobile open.
 *
 * The `.fr-header__menu-links` block must render the **same** content as
 * `.fr-header__tools-links` (in HeaderQuickAccess), otherwise the DSFR
 * `HeaderLinks` script overwrites it via `innerHTML` — which strips React
 * event listeners and breaks the user account menu on mobile.
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
					<HeaderQuickAccessLinks session={session} />
				</div>
				{!session?.user && <Navigation />}
			</div>
		</div>
	);
}
