import Link from "next/link";

import { Breadcrumb } from "~/modules/layout";
import type { PublicPage } from "~/modules/routes";
import { getPublicPages, HOME } from "~/modules/routes";

function PageList({ pages }: { pages: readonly PublicPage[] }) {
	return (
		<ul className="fr-raw-list fr-mb-4w">
			{pages.map(({ path, label }) => (
				<li className="fr-mb-2w" key={path}>
					<Link className="fr-link" href={path}>
						{label}
					</Link>
				</li>
			))}
		</ul>
	);
}

// Both sections render from `~/modules/routes`, the same inventory
// `sitemap.xml` filters — this page used to hold its own list, which had drifted.
export function SitemapPage() {
	return (
		<main id="content" tabIndex={-1}>
			<div className="fr-container fr-py-6w">
				<Breadcrumb
					items={[{ label: "Accueil", href: HOME }, { label: "Plan du site" }]}
				/>

				<h1 className="fr-h1 fr-mt-4w">Plan du site</h1>

				<h2 className="fr-h4">Pages principales</h2>
				<PageList pages={getPublicPages("main")} />

				<h2 className="fr-h4">Pages légales</h2>
				<PageList pages={getPublicPages("legal")} />
			</div>
		</main>
	);
}
