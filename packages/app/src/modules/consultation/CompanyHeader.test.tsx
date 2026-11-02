import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CompanyHeader } from "./CompanyHeader";

type LocationProps = {
	address: string | null;
	countryCode: string | null;
	countryLabel: string | null;
	departmentLabel: string | null;
	region: string | null;
};

const FRENCH: LocationProps = {
	address: "1 rue de la Paix, 75002 Paris",
	countryCode: null,
	countryLabel: "FRANCE",
	departmentLabel: "Paris",
	region: "Île-de-France",
};

function renderHeader(location: LocationProps) {
	render(
		<CompanyHeader
			backHref="/index-egapro/recherche"
			nafCode="62.01Z"
			nafLabel="Programmation informatique"
			name="Société Démo"
			siren="123456789"
			workforceEma={250}
			year={2027}
			{...location}
		/>,
	);
}

function renderWithWorkforce(workforceEma: number | null) {
	render(
		<CompanyHeader
			address={null}
			backHref="/index-egapro/recherche"
			countryCode={null}
			countryLabel={null}
			departmentLabel={null}
			nafCode={null}
			nafLabel={null}
			name="Société Démo"
			region={null}
			siren="123456789"
			workforceEma={workforceEma}
			year={2027}
		/>,
	);
}

function locationFact(): string | null | undefined {
	return screen.queryByText(/^(Adresse|Pays) :/)?.textContent;
}

describe("CompanyHeader", () => {
	it("shows the address of a French company", () => {
		renderHeader(FRENCH);
		expect(locationFact()).toBe("Adresse : 1 rue de la Paix, 75002 Paris");
	});

	it("falls back on the département and region of a French company without address", () => {
		renderHeader({ ...FRENCH, address: null });
		expect(locationFact()).toBe("Adresse : Paris, Île-de-France");
	});

	it("names the country of a Belgian company, never its street", () => {
		renderHeader({
			address: "12 RUE DE LA DEMO",
			countryCode: "99131",
			countryLabel: "BELGIQUE",
			departmentLabel: null,
			region: null,
		});
		expect(locationFact()).toBe("Pays : Belgique");
	});

	it("states an unknown country even when an address is stored", () => {
		renderHeader({
			address: "12 RUE DE LA DEMO",
			countryCode: null,
			countryLabel: null,
			departmentLabel: null,
			region: null,
		});
		expect(locationFact()).toBe("Pays : inconnu");
	});

	it("reads a blank country with a known département as French", () => {
		renderHeader({ ...FRENCH, countryLabel: null });
		expect(locationFact()).toBe("Adresse : 1 rue de la Paix, 75002 Paris");
	});

	it("renders each masked company fact once", () => {
		render(
			<CompanyHeader
				address="Non-diffusible"
				backHref="/index-egapro/recherche"
				countryCode="Non-diffusible"
				countryLabel="Non-diffusible"
				departmentLabel="Non-diffusible"
				nafCode="Non-diffusible"
				nafLabel="Non-diffusible"
				name="Non-diffusible"
				region="Non-diffusible"
				siren="998900003"
				workforceEma={62}
				year={2027}
			/>,
		);

		expect(screen.getByText("Adresse :").parentElement).toHaveTextContent(
			"Adresse : Non-diffusible",
		);
		expect(screen.getByText("Code NAF :").parentElement).toHaveTextContent(
			"Code NAF : Non-diffusible",
		);
		expect(screen.queryByText(/Non-diffusible.*Non-diffusible/)).toBeNull();
	});

	it("shows the GIP average headcount with two truncated decimals", () => {
		renderWithWorkforce(49.876);

		expect(
			screen.getByText("Effectif annuel moyen en 2026 :").parentElement,
		).toHaveTextContent("Effectif annuel moyen en 2026 : 49,87");
	});

	it("does not round a fractional headcount up to the next unit", () => {
		renderWithWorkforce(49.6);

		expect(screen.getByText("49,6")).toBeInTheDocument();
		expect(screen.queryByText("50")).toBeNull();
	});

	it("shows a whole headcount without a decimal part", () => {
		renderWithWorkforce(250);

		expect(screen.getByText("250")).toBeInTheDocument();
	});

	it("omits the headcount when the GIP has none", () => {
		renderWithWorkforce(null);

		expect(screen.queryByText(/Effectif annuel moyen/)).toBeNull();
	});
});
