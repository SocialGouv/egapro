import { Breadcrumb } from "~/modules/layout";

import { PrivacyCookies } from "./PrivacyCookies";
import { PrivacyOverview } from "./PrivacyOverview";
import { PrivacyRightsAndData } from "./PrivacyRightsAndData";

/** Données personnelles / politique de confidentialité page. */
export function PrivacyPolicyPage() {
	return (
		<main id="content" tabIndex={-1}>
			<div className="fr-container fr-py-6w">
				<Breadcrumb
					items={[
						{ label: "Accueil", href: "/" },
						{ label: "Données personnelles" },
					]}
				/>

				<h1 className="fr-h1 fr-mt-4w">Données personnelles</h1>

				<PrivacyOverview />
				<PrivacyRightsAndData />
				<PrivacyCookies />
			</div>
		</main>
	);
}
