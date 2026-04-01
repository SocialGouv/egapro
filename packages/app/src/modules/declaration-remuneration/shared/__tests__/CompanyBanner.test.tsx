import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CompanyBanner } from "../CompanyBanner";

const defaultCompany = {
	name: "Alpha Solutions",
	siren: "123456789",
	workforce: 256,
	hasCse: true,
};

describe("CompanyBanner", () => {
	it("renders breadcrumb with 'Mon espace' link and current page label", () => {
		render(
			<CompanyBanner
				company={defaultCompany}
				currentPageLabel="Déclaration"
				declarationYear={2025}
			/>,
		);

		const link = screen.getByRole("link", { name: "Mon espace" });
		expect(link).toHaveAttribute("href", "/");

		expect(screen.getByText("Déclaration")).toBeInTheDocument();
	});

	it("renders formatted SIREN", () => {
		render(
			<CompanyBanner
				company={defaultCompany}
				currentPageLabel="Déclaration"
				declarationYear={2025}
			/>,
		);

		expect(screen.getByText(/123 456 789/)).toBeInTheDocument();
	});

	it("renders company name", () => {
		render(
			<CompanyBanner
				company={defaultCompany}
				currentPageLabel="Déclaration"
				declarationYear={2025}
			/>,
		);

		expect(screen.getByText(/Alpha Solutions/)).toBeInTheDocument();
	});

	it("renders workforce and CSE values", () => {
		render(
			<CompanyBanner
				company={defaultCompany}
				currentPageLabel="Déclaration"
				declarationYear={2025}
			/>,
		);

		expect(screen.getByText("256")).toBeInTheDocument();
		expect(screen.getByText("Oui")).toBeInTheDocument();
	});

	it("hides workforce when null", () => {
		render(
			<CompanyBanner
				company={{ ...defaultCompany, workforce: null }}
				currentPageLabel="Déclaration"
				declarationYear={2025}
			/>,
		);

		expect(screen.queryByText(/Effectif annuel/)).not.toBeInTheDocument();
	});

	it("shows 'Non renseigné' when hasCse is null", () => {
		render(
			<CompanyBanner
				company={{ ...defaultCompany, hasCse: null }}
				currentPageLabel="Déclaration"
				declarationYear={2025}
			/>,
		);

		expect(screen.getByText("Non renseigné")).toBeInTheDocument();
	});

	it("shows 'Non' when hasCse is false", () => {
		render(
			<CompanyBanner
				company={{ ...defaultCompany, hasCse: false }}
				currentPageLabel="Déclaration"
				declarationYear={2025}
			/>,
		);

		expect(screen.getByText("Non")).toBeInTheDocument();
	});
});
