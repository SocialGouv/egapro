import type { Metadata } from "next";
import { ConsultationSearchPage } from "~/modules/consultation";

export const metadata: Metadata = {
	title: "Rechercher une entreprise et consulter ses résultats",
	description:
		"Recherchez une entreprise par son nom ou son numéro SIREN et consultez ses indicateurs publics d’égalité professionnelle femmes-hommes.",
	alternates: { canonical: "/index-egapro/recherche" },
};

type Props = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function Page(props: Props) {
	return <ConsultationSearchPage searchParams={props.searchParams} />;
}
