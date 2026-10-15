import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	getPublicCompanyLocation: vi.fn(),
	getPublicDeclarationsBySiren: vi.fn(),
	getPublicRepresentationsBySiren: vi.fn(),
	notFound: vi.fn(() => {
		throw new Error("NEXT_NOT_FOUND");
	}),
}));

// The year selector needs useRouter, which the shared next/navigation mock in src/test/setup.ts lacks.
vi.mock("next/navigation", async (importOriginal) => ({
	...(await importOriginal<Record<string, unknown>>()),
	notFound: mocks.notFound,
	usePathname: vi.fn(() => "/index-egapro/entreprise/998900001"),
	useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("~/modules/public-api", async (importOriginal) => ({
	...(await importOriginal<typeof import("~/modules/public-api")>()),
	getPublicCompanyLocation: mocks.getPublicCompanyLocation,
	getPublicDeclarationsBySiren: mocks.getPublicDeclarationsBySiren,
	getPublicRepresentationsBySiren: mocks.getPublicRepresentationsBySiren,
}));

import { declarationFixture } from "./__fixtures__/declaration";
import { representationFixture } from "./__fixtures__/representation";
import { CompanyConsultationPage } from "./CompanyConsultationPage";

const SIREN = "998900001";

const FRENCH_LOCATION = {
	address: "12 rue des Innovateurs, 75011 Paris",
	city: "Paris",
	regionCode: "11",
	region: "Île-de-France",
	departmentCode: "75",
	departmentLabel: "Paris",
	countryCode: null,
	countryLabel: "FRANCE",
};

const BELGIAN_LOCATION = {
	address: "12 RUE DE LA DEMO",
	city: null,
	regionCode: null,
	region: null,
	departmentCode: null,
	departmentLabel: null,
	countryCode: "99131",
	countryLabel: "BELGIQUE",
};

function locationFact(): string | null | undefined {
	return screen.queryByText(/^(Adresse|Pays) :/)?.textContent;
}

function structuredAddress(): unknown {
	const script = document.querySelector('script[type="application/ld+json"]');
	const data = JSON.parse(script?.textContent ?? "{}") as {
		"@graph": { "@type": string; address?: unknown }[];
	};
	return data["@graph"].find((node) => node["@type"] === "Organization")
		?.address;
}

async function renderPage(selectedYear?: number) {
	render(await CompanyConsultationPage({ siren: SIREN, selectedYear }));
}

beforeEach(() => {
	vi.clearAllMocks();
	mocks.getPublicCompanyLocation.mockResolvedValue(FRENCH_LOCATION);
});

describe("CompanyConsultationPage", () => {
	it("keeps showing the released remuneration when no representation is published", async () => {
		mocks.getPublicDeclarationsBySiren.mockResolvedValue([
			declarationFixture({ year: 2027 }),
		]);
		mocks.getPublicRepresentationsBySiren.mockResolvedValue([]);

		await renderPage();

		expect(mocks.notFound).not.toHaveBeenCalled();
		expect(
			screen.getByText("Écarts de rémunération horaire brute moyenne"),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"Aucune déclaration de représentation équilibrée pour 2027",
			),
		).toBeInTheDocument();
	});

	it("offers the union of the years returned by both services, without duplicates", async () => {
		mocks.getPublicDeclarationsBySiren.mockResolvedValue([
			declarationFixture({ year: 2027 }),
			declarationFixture({ year: 2026 }),
		]);
		mocks.getPublicRepresentationsBySiren.mockResolvedValue([
			representationFixture({ year: 2026 }),
		]);

		await renderPage();

		const options = screen
			.getAllByRole("option")
			.map((option) => option.textContent);
		expect(new Set(options)).toEqual(new Set(["2027", "2026"]));
	});

	it("shows the representation of a year both families published", async () => {
		mocks.getPublicDeclarationsBySiren.mockResolvedValue([
			declarationFixture({ year: 2027 }),
		]);
		mocks.getPublicRepresentationsBySiren.mockResolvedValue([
			representationFixture({ year: 2027 }),
		]);

		await renderPage();

		expect(
			screen.getByRole("heading", { name: "Écarts de représentation" }),
		).toBeInTheDocument();
		expect(
			screen.queryByText(
				"Aucune déclaration de représentation équilibrée pour 2027",
			),
		).not.toBeInTheDocument();
	});

	it("returns a not-found page when neither family is published, without reading the location", async () => {
		mocks.getPublicDeclarationsBySiren.mockResolvedValue([]);
		mocks.getPublicRepresentationsBySiren.mockResolvedValue([]);

		await expect(renderPage()).rejects.toThrow("NEXT_NOT_FOUND");
		expect(mocks.notFound).toHaveBeenCalled();
		expect(mocks.getPublicCompanyLocation).not.toHaveBeenCalled();
	});

	it("reads the location of the company row for its siren", async () => {
		mocks.getPublicDeclarationsBySiren.mockResolvedValue([
			declarationFixture({ year: 2027 }),
		]);
		mocks.getPublicRepresentationsBySiren.mockResolvedValue([]);

		await renderPage();

		expect(mocks.getPublicCompanyLocation).toHaveBeenCalledWith(SIREN);
		expect(locationFact()).toBe(
			"Adresse : 12 rue des Innovateurs, 75011 Paris",
		);
	});

	it("shows the address of a French company that published only a representation", async () => {
		mocks.getPublicDeclarationsBySiren.mockResolvedValue([]);
		mocks.getPublicRepresentationsBySiren.mockResolvedValue([
			representationFixture({ year: 2027, address: null }),
		]);

		await renderPage();

		expect(locationFact()).toBe(
			"Adresse : 12 rue des Innovateurs, 75011 Paris",
		);
		expect(structuredAddress()).toEqual({
			"@type": "PostalAddress",
			addressLocality: "Paris",
			addressRegion: "Île-de-France",
			addressCountry: "FRANCE",
		});
	});

	it("names the country of a Belgian company that published only a representation", async () => {
		mocks.getPublicCompanyLocation.mockResolvedValue(BELGIAN_LOCATION);
		mocks.getPublicDeclarationsBySiren.mockResolvedValue([]);
		mocks.getPublicRepresentationsBySiren.mockResolvedValue([
			representationFixture({
				year: 2027,
				region: null,
				departmentLabel: null,
			}),
		]);

		await renderPage();

		expect(locationFact()).toBe("Pays : Belgique");
		expect(screen.queryByText(/12 RUE DE LA DEMO/)).not.toBeInTheDocument();
		expect(structuredAddress()).toEqual({
			"@type": "PostalAddress",
			addressCountry: "99131",
		});
	});

	it("states an unknown country when the company row is missing", async () => {
		mocks.getPublicCompanyLocation.mockResolvedValue(null);
		mocks.getPublicDeclarationsBySiren.mockResolvedValue([
			declarationFixture({ year: 2027 }),
		]);
		mocks.getPublicRepresentationsBySiren.mockResolvedValue([]);

		await renderPage();

		expect(locationFact()).toBe("Pays : inconnu");
		expect(structuredAddress()).toBeUndefined();
	});
});
