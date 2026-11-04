import Link from "next/link";
import { HOME } from "~/modules/routes";

import { ErrorLayout } from "./ErrorLayout";

export function UnderConstructionPage() {
	return (
		<ErrorLayout>
			<h1>Page en cours de construction</h1>
			<p className="fr-mb-5w">
				Le contenu de cette page est en cours de rédaction et sera bientôt
				disponible.
			</p>
			<ul className="fr-btns-group fr-btns-group--inline-md">
				<li>
					<Link className="fr-btn" href={HOME}>
						Page d&apos;accueil
					</Link>
				</li>
			</ul>
		</ErrorLayout>
	);
}
