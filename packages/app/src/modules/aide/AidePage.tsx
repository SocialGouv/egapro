import Link from "next/link";

import { Breadcrumb } from "~/modules/layout";
import { getCampaignDeadlines } from "~/server/db/getCampaignDeadlines";
import { getActiveCampaignYear } from "~/server/db/getGlobalSettings";

import { AideCallout } from "./AideCallout";
import styles from "./AideLayout.module.scss";
import { AideResourceCards } from "./AideResourceCards";
import { AideTextesReference } from "./AideTextesReference";

/** Aide et ressources landing page. */
export async function AidePage() {
	const year = await getActiveCampaignYear();
	const deadlines = await getCampaignDeadlines(year);
	return (
		<main className={styles.pageBackground} id="content" tabIndex={-1}>
			<div className="fr-container fr-pt-3w fr-pb-6w">
				<Breadcrumb
					items={[
						{ label: "Accueil", href: "/" },
						{ label: "Aide et ressources" },
					]}
				/>

				<Link
					aria-label="Retour à l'accueil"
					className="fr-link fr-icon-arrow-left-line fr-link--icon-left"
					href="/"
				>
					Retour
				</Link>

				<h1 className="fr-h1 fr-mt-4w">Aide et ressources</h1>

				<div className="fr-mb-4w">
					<AideCallout
						deadline={deadlines.decl1ModificationDeadline}
						year={year}
					/>
				</div>

				<div className="fr-mb-4w">
					<AideResourceCards />
				</div>

				<div className="fr-mb-4w">
					<AideTextesReference />
				</div>
			</div>
		</main>
	);
}
