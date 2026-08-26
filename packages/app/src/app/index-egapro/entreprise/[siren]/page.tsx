import type { Metadata } from "next";
import { CompanyConsultationPage } from "~/modules/consultation";
import { getPublicDeclarationsBySiren } from "~/modules/public-api";

type Props = {
	params: Promise<{ siren: string }>;
	searchParams: Promise<{ year?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { siren } = await params;
	const rows = await getPublicDeclarationsBySiren(siren, 1);
	const company = rows[0];
	return {
		title: company
			? `${company.name ?? "Entreprise"} — résultats d’égalité professionnelle`
			: "Entreprise introuvable",
		description: company
			? `Consultez les indicateurs publics d’égalité professionnelle de l’entreprise ${company.name ?? siren}.`
			: undefined,
		alternates: { canonical: `/index-egapro/entreprise/${siren}` },
	};
}

export default async function Page({ params, searchParams }: Props) {
	const [{ siren }, query] = await Promise.all([params, searchParams]);
	const selectedYear = query.year ? Number.parseInt(query.year, 10) : undefined;
	return <CompanyConsultationPage selectedYear={selectedYear} siren={siren} />;
}
