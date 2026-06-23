import { getCurrentYear } from "~/modules/domain";
import { api, HydrateClient } from "~/trpc/server";

import { CampaignDeadlinesForm } from "./CampaignDeadlinesForm";
import { LockTimeoutForm } from "./LockTimeoutForm";

export async function AdminSettingsPage() {
	const overview = await api.adminSettings.getOverview();
	const initialYear = overview.configuredYears.at(-1) ?? getCurrentYear();
	const lockTimeout = await api.adminSettings.getLockTimeout();

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

			<section aria-labelledby="lock-timeout-heading" className="fr-mt-4w">
				<h2 className="fr-h3" id="lock-timeout-heading">
					Verrou de déclaration
				</h2>
				<LockTimeoutForm initialTimeoutMinutes={lockTimeout.timeoutMinutes} />
			</section>
		</HydrateClient>
	);
}
