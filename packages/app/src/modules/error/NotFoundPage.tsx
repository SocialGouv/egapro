import Link from "next/link";

import { ErrorLayout } from "./ErrorLayout";

/** 404 Not Found page content following DSFR error page template. */
export function NotFoundPage() {
	return (
		<ErrorLayout>
			<h1>Page non trouvée</h1>
			<p className="fr-text-mention--grey fr-mb-3w">Erreur 404</p>
			<p className="fr-mb-3w">
				La page que vous cherchez est introuvable. Excusez-nous pour la gêne
				occasionnée.
			</p>
			<p className="fr-mb-5w">
				Si vous avez tapé l&apos;adresse web dans le navigateur, vérifiez
				qu&apos;elle est correcte. La page n&apos;est peut-être plus disponible.
				<br />
				Dans ce cas, pour continuer votre visite vous pouvez consulter notre
				page d&apos;accueil.
			</p>
			<ul className="fr-btns-group fr-btns-group--inline-md">
				<li>
					<Link className="fr-btn" href="/">
						Page d&apos;accueil
					</Link>
				</li>
			</ul>
		</ErrorLayout>
	);
}
