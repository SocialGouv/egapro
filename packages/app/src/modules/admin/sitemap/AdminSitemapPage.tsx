import Link from "next/link";

import { ADMIN_SECTIONS, type AdminSection } from "./adminSections";

export function AdminSitemapPage() {
	return (
		<>
			<h1 className="fr-h1">Plan du back-office</h1>
			<p className="fr-text--lead">
				Toutes les rubriques du back-office auxquelles vous avez accès,
				également proposées dans le menu latéral.
			</p>
			<ul className="fr-raw-list">
				{ADMIN_SECTIONS.map((section) => (
					<AdminSitemapEntry key={section.href} section={section} />
				))}
			</ul>
		</>
	);
}

function AdminSitemapEntry({ section }: { section: AdminSection }) {
	return (
		<li className="fr-mb-3w">
			<Link className="fr-link fr-text--lg" href={section.href}>
				{section.label}
			</Link>
			<p className="fr-text--sm fr-mb-0 fr-mt-1v">{section.description}</p>
		</li>
	);
}
