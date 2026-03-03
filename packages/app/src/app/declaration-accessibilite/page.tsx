import type { Metadata } from "next";

import { AccessibilityPage } from "~/modules/legal";

export const metadata: Metadata = {
	title: "Déclaration d'accessibilité",
	description:
		"Déclaration d'accessibilité d'Index Egapro : état de conformité RGAA, résultats des tests et voies de recours.",
};

export default function Page() {
	return <AccessibilityPage />;
}
