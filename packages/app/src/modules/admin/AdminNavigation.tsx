"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN, ADMIN_NAV_LINKS } from "~/modules/routes";

export function AdminNavigation() {
	const pathname = usePathname();

	return (
		<nav aria-labelledby="fr-sidemenu-title" className="fr-sidemenu">
			<div className="fr-sidemenu__inner">
				<button
					aria-controls="fr-sidemenu-wrapper"
					aria-expanded="false"
					className="fr-sidemenu__btn"
					type="button"
				>
					Administration
				</button>
				<div className="fr-collapse" id="fr-sidemenu-wrapper">
					<div className="fr-sidemenu__title" id="fr-sidemenu-title">
						Administration
					</div>
					<ul className="fr-sidemenu__list">
						{ADMIN_NAV_LINKS.map(({ href, label }) => {
							const isActive =
								href === ADMIN ? pathname === ADMIN : pathname.startsWith(href);

							const itemClass = isActive
								? "fr-sidemenu__item fr-sidemenu__item--active"
								: "fr-sidemenu__item";

							return (
								<li className={itemClass} key={href}>
									<Link
										aria-current={isActive ? "page" : undefined}
										className="fr-sidemenu__link"
										href={href}
									>
										{label}
									</Link>
								</li>
							);
						})}
					</ul>
				</div>
			</div>
		</nav>
	);
}
