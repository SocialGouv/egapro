import { Breadcrumb } from "~/modules/layout";

import { AideCallout } from "./AideCallout";
import { AideIllustration } from "./AideIllustration";
import { AideResourceCards } from "./AideResourceCards";
import { AideTextesReference } from "./AideTextesReference";

/** Aide et ressources landing page. */
export function AidePage() {
	return (
		<main id="content" tabIndex={-1}>
			<div className="fr-container fr-py-6w">
				<Breadcrumb
					items={[
						{ label: "Accueil", href: "/" },
						{ label: "Aide et ressources" },
					]}
				/>

				<h1 className="fr-h1 fr-mt-4w">Aide et ressources</h1>

				<div className="fr-mb-6w">
					<AideCallout />
				</div>

				<div className="fr-mb-6w">
					<AideResourceCards />
				</div>

				<div className="fr-mb-6w">
					<AideTextesReference />
				</div>

				<AideIllustration />
			</div>
		</main>
	);
}
