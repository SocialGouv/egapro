import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CompanyHeader } from "./CompanyHeader";

describe("CompanyHeader", () => {
	it("renders each masked company fact once", () => {
		render(
			<CompanyHeader
				address="Non-diffusible"
				backHref="/index-egapro/recherche"
				countryLabel="Non-diffusible"
				departmentLabel="Non-diffusible"
				name="Non-diffusible"
				nafCode="Non-diffusible"
				nafLabel="Non-diffusible"
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
