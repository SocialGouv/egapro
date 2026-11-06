"use client";

import { usePathname } from "next/navigation";
import { HOME, OBSERVATORY_SEARCH } from "~/modules/routes";
import { ConsultationNavLink } from "../shared/ConsultationNavLink";
import { NavLink } from "../shared/NavLink";
import { isDemarcheRoute } from "../shared/routeUtils";

// Renders nothing in the démarche (Mon espace, declaration journeys, avis CSE): the Figma header for those screens has no nav row.
export function Navigation() {
	const pathname = usePathname();
	if (isDemarcheRoute(pathname)) {
		return null;
	}
	return (
		<nav aria-label="Menu principal" className="fr-nav" id="navigation-main">
			<ul className="fr-nav__list">
				<li className="fr-nav__item">
					<NavLink className="fr-nav__link" href={HOME}>
						Accueil
					</NavLink>
				</li>
				<li className="fr-nav__item">
					<ConsultationNavLink
						className="fr-nav__link"
						href={OBSERVATORY_SEARCH}
					>
						Observatoire
					</ConsultationNavLink>
				</li>
			</ul>
		</nav>
	);
}
