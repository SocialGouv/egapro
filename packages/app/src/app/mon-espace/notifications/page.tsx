import type { Metadata } from "next";

import { NotificationPreferencesForm } from "~/modules/notifications";

export const metadata: Metadata = {
	title: "Préférences de notifications",
};

export default function NotificationsPreferencesPage() {
	return (
		<main className="fr-container fr-py-6w" id="main-content">
			<h1 className="fr-h2">Préférences de notifications</h1>
			<p>
				Choisissez les e-mails que vous souhaitez recevoir de la plateforme
				Egapro.
			</p>
			<NotificationPreferencesForm />
		</main>
	);
}
