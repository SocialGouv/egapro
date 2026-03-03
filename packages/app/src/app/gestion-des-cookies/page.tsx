import type { Metadata } from "next";

import { CookiesPage } from "~/modules/legal";

export const metadata: Metadata = {
	title: "Gestion des cookies",
	description:
		"Informations sur les cookies utilisés par Index Egapro et comment les gérer.",
};

export default function Page() {
	return <CookiesPage />;
}
