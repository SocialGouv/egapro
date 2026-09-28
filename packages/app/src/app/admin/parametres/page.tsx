import type { Metadata } from "next";

import { AdminSettingsPage } from "~/modules/admin/settings";

export const metadata: Metadata = { title: "Paramètres de la plateforme" };

export default function Page() {
	return <AdminSettingsPage />;
}
