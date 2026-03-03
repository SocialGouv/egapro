import type { Metadata } from "next";

import { ContactPage } from "~/modules/aide";

export const metadata: Metadata = {
	title: "Nous contacter",
	description:
		"Contactez l'équipe Egapro pour vos questions sur les indicateurs d'égalité professionnelle.",
};

export default function Page() {
	return <ContactPage />;
}
