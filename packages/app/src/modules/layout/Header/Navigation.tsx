import { NavLink } from "../shared/NavLink";

/** Main navigation with flat links. */
export function Navigation() {
	return (
		<nav aria-label="Menu principal" className="fr-nav" id="navigation-main">
			<ul className="fr-nav__list">
				<li className="fr-nav__item">
					<NavLink className="fr-nav__link" href="/">
						Accueil
					</NavLink>
				</li>
				<li className="fr-nav__item">
					<NavLink className="fr-nav__link" href="/index-egapro/recherche">
						Observatoire
					</NavLink>
				</li>
			</ul>
		</nav>
	);
}
