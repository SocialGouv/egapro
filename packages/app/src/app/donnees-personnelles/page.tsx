import type { Metadata } from "next";

import { PrivacyPolicyPage } from "~/modules/legal";

export const metadata: Metadata = {
	title: "Données personnelles",
	description:
		"Politique de confidentialité d'Index Egapro : données collectées, finalités, droits des utilisateurs et cookies.",
};

export default function Page() {
	return <PrivacyPolicyPage />;
}
