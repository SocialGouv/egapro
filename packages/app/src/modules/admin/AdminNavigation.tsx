"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ADMIN_LINKS = [
	{ href: "/admin", label: "Accueil" },
	{ href: "/admin/declarations", label: "Déclarations" },
	{ href: "/admin/liste-referents", label: "Référents" },
] as const;

export function AdminNavigation() {
	const pathname = usePathname() ?? "";

	return (
		<nav aria-label="Menu administration" className="fr-sidemenu">
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
					<ul className="fr-sidemenu__list">
						{ADMIN_LINKS.map(({ href, label }) => {
							const isCurrent =
								href === "/admin"
									? pathname === "/admin"
									: pathname.startsWith(href);
							return (
								<li
									className={`fr-sidemenu__item ${isCurrent ? "fr-sidemenu__item--active" : ""}`}
									key={href}
								>
									<Link
										aria-current={isCurrent ? "page" : undefined}
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
