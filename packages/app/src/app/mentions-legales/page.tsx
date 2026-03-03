import type { Metadata } from "next";

import { LegalNoticePage } from "~/modules/legal";

export const metadata: Metadata = {
	title: "Mentions légales",
	description:
		"Mentions légales du site Index Egapro : éditeur, directeur de la publication, hébergement, accessibilité et sécurité.",
};

export default function Page() {
	return <LegalNoticePage />;
}
