import Link from "next/link";

import { auth } from "~/server/auth";

/** Desktop quick access: help link and login/logout button. */
export async function HeaderQuickAccess() {
	const session = await auth();

	return (
		<div className="fr-header__tools">
			<div className="fr-header__tools-links">
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
		</div>
	);
}
