import { HOME, OBSERVATORY_SEARCH } from "~/modules/routes";
import { ConsultationNavLink } from "../shared/ConsultationNavLink";
import { NavLink } from "../shared/NavLink";

/** Main navigation with flat links. */
export function Navigation() {
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
