import type { Metadata } from "next";

import { FaqPage } from "~/modules/faq";

export const metadata: Metadata = {
	title: "Questions fréquentes (FAQ)",
	description:
		"Réponses aux questions fréquentes sur les indicateurs d'égalité professionnelle Egapro : calcul, déclaration et obligations.",
};

export default function Page() {
	return <FaqPage />;
}
