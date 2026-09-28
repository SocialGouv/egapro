import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ResourceBanner } from "../ResourceBanner";

describe("ResourceBanner", () => {
	it("renders three resource tiles with correct links", () => {
		render(<ResourceBanner />);

		const faqLink = screen.getByRole("link", {
			name: /questions fréquentes/i,
		});
		expect(faqLink).toHaveAttribute("href", "/faq");

		const aideLink = screen.getByRole("link", {
			name: /centre d'aide/i,
		});
		expect(aideLink).toHaveAttribute("href", "/aide");

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
			screen.getByText("Recherchez et accédez à toutes nos ressources"),
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

	it("renders a screen-reader-only section heading above the tiles", () => {
		render(<ResourceBanner />);

		const heading = screen.getByRole("heading", {
			level: 2,
			name: "Ressources et aides",
		});
		expect(heading).toHaveClass("fr-sr-only");
	});

	it("uses a 10/2 column ratio so the illustration sits flush right", () => {
		const { container } = render(<ResourceBanner />);

		const tilesCol = container.querySelector(".fr-col-md-10");
		expect(tilesCol).not.toBeNull();

		const illustrationCol = container.querySelector(".fr-col-md-2");
		expect(illustrationCol).not.toBeNull();
		expect(illustrationCol).toHaveClass("fr-hidden");
		expect(illustrationCol).toHaveClass("fr-unhidden-md");
		expect(illustrationCol).toHaveAttribute("aria-hidden", "true");

		const rightAligner = illustrationCol?.querySelector(
			".fr-grid-row.fr-grid-row--right",
		);
		expect(rightAligner).not.toBeNull();

		const image = rightAligner?.querySelector(
			'[data-src="/assets/images/home/help-illustration.svg"]',
		);
		expect(image).not.toBeNull();
	});
});
