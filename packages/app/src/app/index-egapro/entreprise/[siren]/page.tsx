import type { Metadata } from "next";
import { CompanyConsultationPage } from "~/modules/consultation";
import {
	getPublicDeclarationsBySiren,
	getPublicRepresentationsBySiren,
} from "~/modules/public-api";

type Props = {
	params: Promise<{ siren: string }>;
	searchParams: Promise<{ year?: string; from?: string }>;
};

export async function generateMetadata({
	params,
	searchParams,
}: Props): Promise<Metadata> {
	const [{ siren }, query] = await Promise.all([params, searchParams]);
	const [declarations, representations] = await Promise.all([
		getPublicDeclarationsBySiren(siren, 1),
		getPublicRepresentationsBySiren(siren, 1),
	]);
	const company = declarations[0] ?? representations[0];
	return {
		title: company
			? `${company.name ?? "Entreprise"} — résultats d’égalité professionnelle`
			: "Entreprise introuvable",
		description: company
			? `Consultez les indicateurs publics d’égalité professionnelle de l’entreprise ${company.name ?? siren}.`
			: undefined,
		alternates: { canonical: `/index-egapro/entreprise/${siren}` },
		// Only the canonical view — the latest published campaign — is indexed;
		// past and future years stay reachable through the client-side selector.
		...(query.year ? { robots: { index: false, follow: true } } : {}),
	};
}

export default async function Page({ params, searchParams }: Props) {
	const [{ siren }, query] = await Promise.all([params, searchParams]);
	const selectedYear = query.year ? Number.parseInt(query.year, 10) : undefined;
	return (
		<CompanyConsultationPage
			from={query.from}
			selectedYear={selectedYear}
			siren={siren}
		/>
	);
}
