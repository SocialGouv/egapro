import Link from "next/link";

import { auth } from "~/server/auth";

<<<<<<< HEAD
/** Desktop quick access: help link and login/logout button. */
||||||| 231b3558
/** Accès rapide desktop : bouton "Se connecter" / "Se déconnecter". */
=======
/** Desktop quick access: "Sign in" / "Sign out" button. */
>>>>>>> alpha
export async function HeaderQuickAccess() {
	const session = await auth();

	return (
		<div className="fr-header__tools">
			<div className="fr-header__tools-links">
				<ul className="fr-btns-group">
					<li>
						<Link
							className="fr-btn fr-btn--tertiary-no-outline fr-icon-question-fill fr-btn--icon-left"
							href="/faq"
						>
							Help
						</Link>
					</li>
					<li>
						{session?.user ? (
							<Link
								className="fr-btn fr-icon-logout-box-r-line"
								href="/api/auth/signout"
							>
								{session.user.name ?? "Sign out"}
							</Link>
						) : (
							<Link
								className="fr-btn fr-icon-account-circle-line"
								href="/login"
							>
								Sign in
							</Link>
						)}
					</li>
				</ul>
			</div>
		</div>
	);
}
