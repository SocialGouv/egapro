import { getCurrentYear } from "~/modules/domain";
import { api, HydrateClient } from "~/trpc/server";

import { AdminSettingsSections } from "./AdminSettingsSections";

export async function AdminSettingsPage() {
	const overview = await api.adminSettings.getOverview();
	const lockTimeout = await api.adminSettings.getLockTimeout();

	return (
		<HydrateClient>
			<h1 className="fr-h1">Paramètres de la plateforme</h1>
			<p>
				Éditez les variables globales utilisées par la plateforme pour encadrer
				les campagnes de déclaration.
			</p>

			<AdminSettingsSections
				configuredYears={overview.configuredYears}
				initialYear={getCurrentYear()}
				lockTimeoutMinutes={lockTimeout.timeoutMinutes}
			/>
		</HydrateClient>
	);
}
