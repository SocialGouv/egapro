import Link from "next/link";

import { auth } from "~/server/auth";
import { UserAccountMenu } from "./UserAccountMenu";

/** Desktop quick access: help link and login/logout button or account menu. */
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
		</div>
	);
}
