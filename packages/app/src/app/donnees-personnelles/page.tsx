import type { Metadata } from "next";

import { PrivacyPolicyPage } from "~/modules/legal";

export const metadata: Metadata = {
	title: "Politique de confidentialité",
	description:
		"Politique de confidentialité d'Egapro : données collectées, finalités, droits des utilisateurs et cookies.",
};

export default function Page() {
	return <PrivacyPolicyPage />;
}
