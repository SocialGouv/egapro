import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CompanyListHeader } from "../CompanyListHeader";

describe("CompanyListHeader", () => {
	it("renders the H2 title", () => {
		render(<CompanyListHeader />);
		expect(
			screen.getByRole("heading", { level: 2, name: "Mes entreprises" }),
		).toBeInTheDocument();
	});

	it("renders the add company link with correct DSFR classes", () => {
		render(<CompanyListHeader />);
		const link = screen.getByRole("link", {
			name: /Ajouter une entreprise sur ProConnect/,
		});
		expect(link).toBeInTheDocument();
		expect(link).toHaveClass("fr-btn");
		expect(link).toHaveClass("fr-btn--secondary");
		expect(link).toHaveClass("fr-btn--icon-right");
		expect(link).toHaveClass("fr-icon-arrow-right-line");
	});

	it("opens the add company link in a new tab", () => {
		render(<CompanyListHeader />);
		const link = screen.getByRole("link", {
			name: /Ajouter une entreprise sur ProConnect/,
		});
		expect(link).toHaveAttribute("target", "_blank");
		expect(link).toHaveAttribute("rel", "noopener noreferrer");
	});
});
