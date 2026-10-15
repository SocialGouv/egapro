import type { Metadata } from "next";

import { getCurrentTermsOfUseVersion, TermsOfUsePage } from "~/modules/legal";

export const metadata: Metadata = {
	title: "Conditions générales d'utilisation",
	description:
		"Conditions générales d'utilisation d'Egapro : objet, fonctionnalités, responsabilités et historique des versions.",
};

export default function Page() {
	return <TermsOfUsePage isCurrent version={getCurrentTermsOfUseVersion()} />;
}
