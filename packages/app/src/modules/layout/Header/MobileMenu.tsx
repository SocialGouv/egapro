import Link from "next/link";

import { auth } from "~/server/auth";
import { Navigation } from "./Navigation";

/**
 * Mobile navigation modal.
 * Opened via the #fr-btn-menu-mobile button, managed by DSFR JS.
 * role="dialog" is required for aria-label to be valid on a <div>.
 */
export async function MobileMenu() {
	const session = await auth();

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
					Close
				</button>
				<div className="fr-header__menu-links">
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
				<Navigation />
			</div>
		</div>
	);
}
