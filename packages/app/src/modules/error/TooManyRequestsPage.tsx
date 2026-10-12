import Link from "next/link";

import { ErrorLayout } from "./ErrorLayout";

/** 429 Too Many Requests page content following DSFR error page template. */
export function TooManyRequestsPage() {
	return (
		<ErrorLayout>
			<h1>Trop de consultations</h1>
			<p className="fr-text-mention--grey fr-mb-3w">Erreur 429</p>
			<p className="fr-mb-3w">
				Vous avez effectué trop de consultations en peu de temps.
			</p>
			<p className="fr-mb-5w">
				Patientez une minute, puis rafraîchissez la page.
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
