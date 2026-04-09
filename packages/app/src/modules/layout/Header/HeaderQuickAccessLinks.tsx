import Link from "next/link";
import type { Session } from "next-auth";

import { UserAccountMenu } from "./UserAccountMenu";

type Props = {
	session: Session | null;
};

/**
 * Shared list of header quick-access actions used both in the desktop tools
 * bar (`.fr-header__tools-links`) and inside the mobile modal
 * (`.fr-header__menu-links`).
 *
 * Both containers MUST render byte-identical HTML, otherwise the DSFR JS
 * `HeaderLinks.init()` clones the desktop tools into the mobile menu (via
 * `innerHTML`), which strips React event listeners and breaks the menu.
 */
export function HeaderQuickAccessLinks({ session }: Props) {
	return (
		<ul className="fr-btns-group">
			<li>
				<Link
					className="fr-btn fr-btn--tertiary-no-outline fr-icon-information-line fr-btn--icon-left"
					href="/aide"
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
	);
}
