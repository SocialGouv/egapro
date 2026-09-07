import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CompanyHeader } from "./CompanyHeader";

describe("CompanyHeader", () => {
	it("labels the seeded workforce with the displayed data year", () => {
		render(
			<CompanyHeader
				address="13 rue de la Démonstration, 33000 Bordeaux"
				backHref="/index-egapro/recherche"
				countryCode={null}
				countryLabel="FRANCE"
				departmentLabel="Gironde"
				nafCode="16.23Z"
				nafLabel="Fabrication de charpentes et d’autres menuiseries"
				name="Aquitaine Mobilier Durable"
				region="Nouvelle-Aquitaine"
				siren="998900013"
				workforceEma={60}
				year={2025}
			/>,
		);

		expect(
			screen.getByText("Effectif annuel moyen en 2025 :").parentElement,
		).toHaveTextContent("Effectif annuel moyen en 2025 : 60");
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
