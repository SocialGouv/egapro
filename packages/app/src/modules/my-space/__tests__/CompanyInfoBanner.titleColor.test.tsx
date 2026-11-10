import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CompanyInfoBanner } from "../CompanyInfoBanner";
import type { CompanyDetail } from "../types";

const company: CompanyDetail = {
	siren: "532847196",
	name: "Alpha Solutions",
	address: "12 RUE DE PARIS, 75001 PARIS",
	nafCode: "62.01Z",
	nafLabel: "Programmation informatique",
	countryCode: null,
	countryLabel: "FRANCE",
	departmentLabel: null,
	gipWorkforce: 250,
	hasCse: null,
};

describe("CompanyInfoBanner — text colour", () => {
	it.each([
		"SIREN :",
		"Adresse :",
		"Code NAF :",
		"Existence d'un CSE :",
	])("renders the '%s' datapoint in the title grey", (label) => {
		render(<CompanyInfoBanner company={company} />);
		expect(screen.getByText(label).closest("dl")).toHaveClass(
			"fr-text-title--grey",
		);
	});
});
