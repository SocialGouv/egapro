import { Breadcrumb } from "~/modules/layout";

import { AccessibilityCompliance } from "./AccessibilityCompliance";
import { AccessibilityContact } from "./AccessibilityContact";
import { AccessibilityEstablishment } from "./AccessibilityEstablishment";

/** Déclaration d'accessibilité page (RGAA). */
export function AccessibilityPage() {
	return (
		<main id="content" tabIndex={-1}>
			<div className="fr-container fr-py-6w">
				<Breadcrumb
					items={[
						{ label: "Accueil", href: "/" },
						{ label: "Déclaration d'accessibilité" },
					]}
				/>

				<h1 className="fr-h1 fr-mt-4w">Déclaration d'accessibilité</h1>

				<p>
					La Direction générale du travail s'engage à rendre son service
					accessible, conformément à l'article 47 de la loi n° 2005-102 du 11
					février 2005.
				</p>

				<AccessibilityCompliance />
				<AccessibilityEstablishment />
				<AccessibilityContact />
			</div>
		</main>
	);
}
