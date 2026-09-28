import { describe, expect, it } from "vitest";
import {
	companyPageStructuredData,
	searchPageStructuredData,
} from "./structuredData";

const ORIGIN = "https://egapro.example.fr";

const COMPANY = {
	siren: "123456789",
	name: "Société Démo",
	year: 2026,
	city: "Paris",
	region: "Île-de-France",
	departmentLabel: "Paris",
	countryLabel: null,
	countryCode: null,
	nafLabel: "Programmation informatique",
	workforceEma: 248,
};

function graphOf(data: Record<string, unknown>): Record<string, unknown>[] {
	return data["@graph"] as Record<string, unknown>[];
}

function nodeOfType(
	data: Record<string, unknown>,
	type: string,
): Record<string, unknown> | undefined {
	return graphOf(data).find((node) => node["@type"] === type);
}

describe("companyPageStructuredData", () => {
	it("describes the company as an Organization at its canonical URL", () => {
		const data = companyPageStructuredData(COMPANY, ORIGIN, false);
		const organization = nodeOfType(data, "Organization");

		expect(organization).toMatchObject({
			name: "Société Démo",
			identifier: "123456789",
			url: `${ORIGIN}/index-egapro/entreprise/123456789`,
			numberOfEmployees: 248,
			address: {
				"@type": "PostalAddress",
				addressLocality: "Paris",
				addressRegion: "Île-de-France",
				addressCountry: "FR",
			},
		});
	});

	it("never republishes a withheld identity", () => {
		const data = companyPageStructuredData(
			{ ...COMPANY, name: "Non-diffusible" },
			ORIGIN,
			true,
		);

		expect(nodeOfType(data, "Organization")).toBeUndefined();
		expect(nodeOfType(data, "WebPage")).toBeDefined();
	});

	it("names the country of a company registered abroad", () => {
		const data = companyPageStructuredData(
			{
				...COMPANY,
				city: "Bruxelles",
				region: null,
				departmentLabel: null,
				countryLabel: "Belgique",
				countryCode: "BE",
			},
			ORIGIN,
			false,
		);

		expect(nodeOfType(data, "Organization")?.address).toMatchObject({
			addressLocality: "Bruxelles",
			addressCountry: "BE",
		});
	});

	it("walks the breadcrumb from the observatory to the company", () => {
		const breadcrumb = nodeOfType(
			companyPageStructuredData(COMPANY, ORIGIN, false),
			"BreadcrumbList",
		);

		expect(breadcrumb?.itemListElement).toEqual([
			{
				"@type": "ListItem",
				position: 1,
				name: "Observatoire",
				item: `${ORIGIN}/index-egapro/recherche`,
			},
			{
				"@type": "ListItem",
				position: 2,
				name: "Société Démo",
				item: `${ORIGIN}/index-egapro/entreprise/123456789`,
			},
		]);
	});
});

describe("searchPageStructuredData", () => {
	it("exposes the observatory search as a SearchAction", () => {
		const website = nodeOfType(searchPageStructuredData(ORIGIN), "WebSite");

		expect(website?.potentialAction).toMatchObject({
			"@type": "SearchAction",
			target: {
				urlTemplate: `${ORIGIN}/index-egapro/recherche?q={search_term_string}`,
			},
		});
	});
});
