import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { HeaderQuickAccessLinks } from "./HeaderQuickAccessLinks";
import { MobileUserBlock } from "./MobileUserBlock";
import { Navigation } from "./Navigation";

/**
 * Header menu: visible as nav bar on desktop, modal dialog on mobile.
 * DSFR JS manages role="dialog" and aria-modal dynamically on mobile open.
 *
 * Two DSFR-specific constraints shape this layout:
 * 1. `HeaderLinks.init()` clones `.fr-header__tools-links` into
 *    `.fr-header__menu-links` (via `innerHTML`) when the two contents differ —
 *    which strips React event listeners. So we render the exact same
 *    `HeaderQuickAccessLinks` component in both containers.
 * 2. The desktop UserAccountMenu (a dropdown) is hidden via CSS inside the
 *    mobile modal, and replaced by an inline `MobileUserBlock` rendered as a
 *    sibling of `.fr-header__menu-links` so DSFR's `HeaderLinks` script does
 *    not see it.
 */
export async function MobileMenu() {
	const session = await auth();

	// Read phone fresh from DB (cf. HeaderQuickAccess for the rationale).
	const profile = session?.user
		? await api.profile.get().catch(() => null)
		: null;
	const userPhone = profile?.phone ?? null;

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
					<HeaderQuickAccessLinks session={session} userPhone={userPhone} />
				</div>
				{session?.user && (
					<MobileUserBlock
						userEmail={session.user.email ?? ""}
						userName={session.user.name ?? "Utilisateur"}
						userPhone={userPhone ?? undefined}
					/>
				)}
				{!session?.user && <Navigation />}
			</div>
		</div>
	);
}
