import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CompanyBanner } from "../CompanyBanner";

const defaultCompany = {
	name: "Alpha Solutions",
	siren: "123456789",
	nafCode: "62.01Z",
	nafLabel: "Programmation informatique",
	workforce: 256,
	hasCse: true,
};

describe("CompanyBanner", () => {
	it("renders breadcrumb with 3 items: Mon espace, company name and current page label", () => {
		render(
			<CompanyBanner company={defaultCompany} currentPageLabel="Déclaration" />,
		);

		const link = screen.getByRole("link", { name: "Mon espace" });
		expect(link).toHaveAttribute("href", "/");

		expect(screen.getByText("Déclaration")).toBeInTheDocument();

		const nav = screen.getByRole("navigation");
		expect(nav).toHaveTextContent("Alpha Solutions");
	});

	it("renders formatted SIREN with label", () => {
		render(
			<CompanyBanner company={defaultCompany} currentPageLabel="Déclaration" />,
		);

		expect(screen.getByText("SIREN :")).toBeInTheDocument();
		expect(screen.getByText(/123 456 789/)).toBeInTheDocument();
	});

	it("renders company name as bold paragraph", () => {
		render(
			<CompanyBanner company={defaultCompany} currentPageLabel="Déclaration" />,
		);

		const boldName = screen.getByText("Alpha Solutions", {
			selector: "p",
		});
		expect(boldName).toBeInTheDocument();
		expect(boldName).toHaveClass("fr-text--bold");
	});

	it("renders NAF code with its activity label", () => {
		render(
			<CompanyBanner company={defaultCompany} currentPageLabel="Déclaration" />,
		);

		expect(screen.getByText("Code NAF :")).toBeInTheDocument();
		expect(
			screen.getByText("62.01Z — Programmation informatique"),
		).toBeInTheDocument();
	});

	it("renders NAF code alone when the label is null", () => {
		render(
			<CompanyBanner
				company={{ ...defaultCompany, nafLabel: null }}
				currentPageLabel="Déclaration"
			/>,
		);

		expect(screen.getByText("Code NAF :")).toBeInTheDocument();
		expect(screen.getByText("62.01Z")).toBeInTheDocument();
		expect(
			screen.queryByText(/Programmation informatique/),
		).not.toBeInTheDocument();
	});

	it("hides the NAF datapoint when nafCode is null", () => {
		render(
			<CompanyBanner
				company={{ ...defaultCompany, nafCode: null, nafLabel: null }}
				currentPageLabel="Déclaration"
			/>,
		);

		expect(screen.queryByText("Code NAF :")).not.toBeInTheDocument();
	});

	it("renders workforce and CSE values", () => {
		render(
			<CompanyBanner company={defaultCompany} currentPageLabel="Déclaration" />,
		);

		expect(screen.getByText("256")).toBeInTheDocument();
		expect(screen.getByText("Oui")).toBeInTheDocument();
	});

	it("hides workforce when null", () => {
		render(
			<CompanyBanner
				company={{ ...defaultCompany, workforce: null }}
				currentPageLabel="Déclaration"
			/>,
		);

		expect(screen.queryByText(/Effectif annuel/)).not.toBeInTheDocument();
	});

	it("shows 'Non renseigné' when hasCse is null", () => {
		render(
			<CompanyBanner
				company={{ ...defaultCompany, hasCse: null }}
				currentPageLabel="Déclaration"
			/>,
		);

		expect(screen.getByText("Non renseigné")).toBeInTheDocument();
	});

	it("shows 'Non' when hasCse is false", () => {
		render(
			<CompanyBanner
				company={{ ...defaultCompany, hasCse: false }}
				currentPageLabel="Déclaration"
			/>,
		);

		expect(screen.getByText("Non")).toBeInTheDocument();
	});
});
