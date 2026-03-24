import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ResourceBanner } from "../ResourceBanner";

describe("ResourceBanner", () => {
	it("renders three resource tiles with correct links", () => {
		render(<ResourceBanner />);

		const faqLink = screen.getByRole("link", {
			name: /questions fréquentes/i,
		});
		expect(faqLink).toHaveAttribute("href", "/faq");

		const textesLink = screen.getByRole("link", {
			name: /textes de référence/i,
		});
		expect(textesLink).toHaveAttribute("href", "/textes-reference");

		const contactLink = screen.getByRole("link", {
			name: /nous contacter/i,
		});
		expect(contactLink).toHaveAttribute("href", "/aide/nous-contacter");
	});

	it("renders detail text for each tile", () => {
		render(<ResourceBanner />);

		expect(
			screen.getByText("Réponses aux questions les plus courantes"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Consultez les textes législatifs et réglementaires"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Besoin d'aide ? Contactez nos services d'assistance"),
		).toBeInTheDocument();
	});

	it("renders three heading level 3 for tile titles", () => {
		render(<ResourceBanner />);

		const headings = screen.getAllByRole("heading", { level: 3 });
		expect(headings).toHaveLength(3);
	});
});
