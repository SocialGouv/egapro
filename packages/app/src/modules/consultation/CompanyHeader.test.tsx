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
});
