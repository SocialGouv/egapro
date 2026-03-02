import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CompanyBanner } from "../CompanyBanner";

describe("CompanyBanner", () => {
	it("renders breadcrumb with 'Mon espace' link and current page label", () => {
		render(<CompanyBanner currentPageLabel="Déclaration" siren="123456789" />);

		const link = screen.getByRole("link", { name: "Mon espace" });
		expect(link).toHaveAttribute("href", "/");

		expect(screen.getByText("Déclaration")).toBeInTheDocument();
	});

	it("renders formatted SIREN", () => {
		render(<CompanyBanner currentPageLabel="Déclaration" siren="123456789" />);

		expect(screen.getByText(/123 456 789/)).toBeInTheDocument();
	});

	it("renders company name", () => {
		render(<CompanyBanner currentPageLabel="Déclaration" siren="123456789" />);

		expect(screen.getByText(/Mon entreprise/)).toBeInTheDocument();
	});

	it("renders effectif and CSE values", () => {
		render(<CompanyBanner currentPageLabel="Déclaration" siren="123456789" />);

		expect(screen.getByText("45")).toBeInTheDocument();
		expect(screen.getByText("Oui")).toBeInTheDocument();
	});
});
