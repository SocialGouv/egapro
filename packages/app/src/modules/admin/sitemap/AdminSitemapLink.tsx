"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ADMIN_SITEMAP } from "~/modules/routes";

export function AdminSitemapLink() {
	const isCurrent = usePathname() === ADMIN_SITEMAP;

	return (
		<nav aria-label="Plan du back-office" className="fr-mt-3w">
			<Link
				aria-current={isCurrent ? "page" : undefined}
				className="fr-link fr-icon-list-unordered fr-link--icon-left"
				href={ADMIN_SITEMAP}
			>
				Plan du back-office
			</Link>
		</nav>
	);
}
