"use client";

import { usePathname } from "next/navigation";

import { isAdminRoute } from "./routeUtils";

/**
 * Skip links — mandatory RGAA criterion 12.7.
 * Allow keyboard/screen reader users to skip directly
 * to the main content or the footer.
 *
 * Admin routes (`/admin/**`) render no footer (`PublicChrome` returns null),
 * so the "Pied de page" link is hidden there to avoid an orphan anchor.
 */
export function SkipLinks() {
	const pathname = usePathname();
	const hasFooter = !isAdminRoute(pathname);

	return (
		<div className="fr-skiplinks">
			<nav aria-label="Accès rapide" className="fr-container">
				<ul className="fr-skiplinks__list">
					<li>
						<a className="fr-link" href="#content">
							Contenu
						</a>
					</li>
					{hasFooter && (
						<li>
							<a className="fr-link" href="#footer">
								Pied de page
							</a>
						</li>
					)}
				</ul>
			</nav>
		</div>
	);
}
