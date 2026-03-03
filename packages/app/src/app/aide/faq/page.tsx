import type { Metadata } from "next";

import { FaqPage } from "~/modules/aide";

export const metadata: Metadata = {
	title: "Questions fréquentes (FAQ)",
	description:
		"Questions fréquentes sur les indicateurs d'égalité professionnelle : calculs, obligations et réponses.",
};

export default function Page() {
	return <FaqPage />;
}
