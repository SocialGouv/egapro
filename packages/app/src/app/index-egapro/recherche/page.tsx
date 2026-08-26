import type { Metadata } from "next";
import { ConsultationSearchPage } from "~/modules/consultation";

export const metadata: Metadata = {
	title: "Consulter les résultats d’égalité professionnelle",
	description:
		"Recherchez une entreprise et consultez ses indicateurs publics d’égalité professionnelle femmes-hommes.",
	alternates: { canonical: "/index-egapro/recherche" },
};

type Props = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function Page(props: Props) {
	return <ConsultationSearchPage searchParams={props.searchParams} />;
}
