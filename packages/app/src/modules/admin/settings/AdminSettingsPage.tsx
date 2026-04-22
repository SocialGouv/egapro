import { getCurrentYear } from "~/modules/domain";
import { api, HydrateClient } from "~/trpc/server";

import { CampaignDeadlinesForm } from "./CampaignDeadlinesForm";

/**
 * Backoffice page to edit per-year campaign deadlines (GIP publication,
 * campaign start, CSE and declaration deadlines). The active campaign year is
 * now deduced from the `campaignStartDate` field and no longer edited here.
 */
export async function AdminSettingsPage() {
	const overview = await api.adminSettings.getOverview();
	const initialYear = overview.configuredYears.at(-1) ?? getCurrentYear();

	return (
		<HydrateClient>
			<h1 className="fr-h1">Paramètres de la plateforme</h1>
			<p>
				Éditez les variables globales utilisées par la plateforme pour encadrer
				les campagnes de déclaration.
			</p>

			<section aria-labelledby="deadlines-heading" className="fr-mt-4w">
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
