import { NavLink } from "../shared/NavLink";

/** Main navigation with flat links. */
export function Navigation() {
	return (
		<nav aria-label="Main menu" className="fr-nav" id="navigation-main">
			<ul className="fr-nav__list">
				<li className="fr-nav__item">
					<NavLink className="fr-nav__link" href="/">
						Home
					</NavLink>
				</li>
				<li className="fr-nav__item">
					<NavLink className="fr-nav__link" href="/index-egapro/recherche">
						Observatory
					</NavLink>
				</li>
			</ul>
		</nav>
	);
}
