import { SEARCH_PATH } from "./constants";

type CompanyInput = {
	siren: string;
	name: string | null;
	year: number;
	city: string | null;
	region: string | null;
	departmentLabel: string | null;
	countryLabel: string | null;
	countryCode: string | null;
	nafLabel: string | null;
	workforceEma: number | null;
};

function postalAddress(company: CompanyInput): Record<string, unknown> | null {
	const locality = company.city ?? company.departmentLabel;
	if (!locality && !company.region && !company.countryLabel) return null;
	return {
		"@type": "PostalAddress",
		...(locality ? { addressLocality: locality } : {}),
		...(company.region ? { addressRegion: company.region } : {}),
		addressCountry: company.countryCode ?? company.countryLabel ?? "FR",
	};
}

export function companyPageStructuredData(
	company: CompanyInput,
	origin: string,
	isNameWithheld: boolean,
): Record<string, unknown> {
	const url = `${origin}/index-egapro/entreprise/${company.siren}`;
	const breadcrumb = {
		"@type": "BreadcrumbList",
		itemListElement: [
			{
				"@type": "ListItem",
				position: 1,
				name: "Observatoire",
				item: `${origin}${SEARCH_PATH}`,
			},
			{
				"@type": "ListItem",
				position: 2,
				name: company.name ?? `Entreprise ${company.siren}`,
				item: url,
			},
		],
	};

	// A withheld identity must not be republished as structured data: the graph
	// then carries the page and its breadcrumb, never a masked Organization.
	const address = postalAddress(company);
	const organization =
		isNameWithheld || !company.name
			? null
			: {
					"@type": "Organization",
					name: company.name,
					identifier: company.siren,
					url,
					...(company.nafLabel ? { naics: company.nafLabel } : {}),
					...(company.workforceEma !== null
						? { numberOfEmployees: company.workforceEma }
						: {}),
					...(address ? { address } : {}),
				};

	return {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "WebPage",
				"@id": url,
				url,
				name: `${company.name ?? `Entreprise ${company.siren}`} — résultats d’égalité professionnelle`,
				inLanguage: "fr-FR",
				isPartOf: { "@type": "WebSite", url: origin },
				breadcrumb,
			},
			breadcrumb,
			...(organization ? [organization] : []),
		],
	};
}

export function searchPageStructuredData(
	origin: string,
): Record<string, unknown> {
	const url = `${origin}${SEARCH_PATH}`;
	return {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "WebSite",
				url: origin,
				inLanguage: "fr-FR",
				potentialAction: {
					"@type": "SearchAction",
					target: {
						"@type": "EntryPoint",
						urlTemplate: `${url}?q={search_term_string}`,
					},
					"query-input": "required name=search_term_string",
				},
			},
			{
				"@type": "CollectionPage",
				"@id": url,
				url,
				name: "Rechercher une entreprise et consulter ses résultats",
				inLanguage: "fr-FR",
				isPartOf: { "@type": "WebSite", url: origin },
			},
		],
	};
}
