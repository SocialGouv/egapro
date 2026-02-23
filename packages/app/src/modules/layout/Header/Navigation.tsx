import { NavLink } from "../shared/NavLink";

/** Navigation principale avec sous-menus déroulants (gérés par le JS DSFR). */
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
					<button
						aria-controls="menu-index"
						aria-expanded="false"
						className="fr-nav__btn"
						type="button"
					>
						Index
					</button>
					<div className="fr-collapse fr-menu" id="menu-index">
						<ul className="fr-menu__list">
							<li>
								<NavLink className="fr-nav__link" href="/index-egapro">
									À propos de l'index
								</NavLink>
							</li>
							<li>
								<NavLink
									className="fr-nav__link"
									href="/index-egapro/simulateur/commencer"
								>
									Calculer mon index
								</NavLink>
							</li>
							<li>
								<NavLink
									className="fr-nav__link"
									href="/index-egapro/declaration/assujetti"
								>
									Déclarer mon index
								</NavLink>
							</li>
							<li>
								<NavLink
									className="fr-nav__link"
									href="/index-egapro/recherche"
								>
									Consulter l'index
								</NavLink>
							</li>
						</ul>
					</div>
				</li>
				<li className="fr-nav__item">
					<button
						aria-controls="menu-representation"
						aria-expanded="false"
						className="fr-nav__btn"
						type="button"
					>
						Représentation équilibrée
					</button>
					<div className="fr-collapse fr-menu" id="menu-representation">
						<ul className="fr-menu__list">
							<li>
								<NavLink
									className="fr-nav__link"
									href="/representation-equilibree"
								>
									À propos des écarts
								</NavLink>
							</li>
							<li>
								<NavLink
									className="fr-nav__link"
									href="/representation-equilibree/assujetti"
								>
									Déclarer les écarts
								</NavLink>
							</li>
							<li>
								<NavLink
									className="fr-nav__link"
									href="/representation-equilibree/recherche"
								>
									Consulter les écarts
								</NavLink>
							</li>
						</ul>
					</div>
				</li>
			</ul>
		</nav>
	);
}
