import { getCurrentYear } from "~/modules/domain";
import { api, HydrateClient } from "~/trpc/server";

import { ActiveYearForm } from "./ActiveYearForm";
import { CampaignDeadlinesForm } from "./CampaignDeadlinesForm";

/**
 * Backoffice page to edit global platform variables: active campaign year
 * and per-year campaign deadlines (GIP publication, campaign start, CSE and
 * declaration deadlines).
 */
export async function AdminSettingsPage() {
	const overview = await api.adminSettings.getOverview();
	const fallbackYear = getCurrentYear();
	const initialYear = overview.activeCampaignYear ?? fallbackYear;

	return (
		<HydrateClient>
			<h1 className="fr-h1">Paramètres de la plateforme</h1>
			<p>
				Éditez les variables globales utilisées par la plateforme pour encadrer
				les campagnes de déclaration.
			</p>

			<section aria-labelledby="active-year-heading" className="fr-mt-4w">
				<h2 className="fr-h3" id="active-year-heading">
					Année de campagne active
				</h2>
				<ActiveYearForm
					fallbackYear={fallbackYear}
					initialActiveYear={overview.activeCampaignYear}
				/>
			</section>

			<section aria-labelledby="deadlines-heading" className="fr-mt-6w">
				<h2 className="fr-h3" id="deadlines-heading">
					Échéances de campagne
				</h2>
				<CampaignDeadlinesForm
					configuredYears={overview.configuredYears}
					initialYear={initialYear}
				/>
			</section>
		</HydrateClient>
	);
}
