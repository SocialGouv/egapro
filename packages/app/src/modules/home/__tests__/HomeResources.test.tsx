import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeResources } from "../HomeResources";

describe("HomeResources", () => {
	it("affiche la tuile FAQ", () => {
		render(<HomeResources />);
		expect(
			screen.getByRole("heading", {
				name: /questions fréquentes/i,
			}),
		).toBeInTheDocument();
	});

	it("affiche la tuile Textes de référence", () => {
		render(<HomeResources />);
		expect(
			screen.getByRole("heading", {
				name: /textes de référence/i,
			}),
		).toBeInTheDocument();
	});

	it("affiche la tuile Nous contacter", () => {
		render(<HomeResources />);
		expect(
			screen.getByRole("heading", {
				name: /nous contacter/i,
			}),
		).toBeInTheDocument();
	});

	it("le lien FAQ pointe vers /faq", () => {
		render(<HomeResources />);
		expect(
			screen.getByRole("link", { name: /questions fréquentes/i }),
		).toHaveAttribute("href", "/faq");
	});

	it("le lien Textes de référence pointe vers /textes-reference", () => {
		render(<HomeResources />);
		expect(
			screen.getByRole("link", { name: /textes de référence/i }),
		).toHaveAttribute("href", "/textes-reference");
	});

	it("le lien Nous contacter pointe vers /contact", () => {
		render(<HomeResources />);
		expect(
			screen.getByRole("link", { name: /nous contacter/i }),
		).toHaveAttribute("href", "/contact");
	});

	it("affiche le détail de chaque tuile", () => {
		render(<HomeResources />);
		expect(
			screen.getByText(/réponses aux questions les plus courantes/i),
		).toBeInTheDocument();
		expect(
			screen.getByText(/consultez les textes législatifs/i),
		).toBeInTheDocument();
		expect(
			screen.getByText(/contactez nos services d'assistance/i),
		).toBeInTheDocument();
	});

	it("les tuiles ont la classe fr-tile--horizontal", () => {
		const { container } = render(<HomeResources />);
		const tiles = container.querySelectorAll(".fr-tile--horizontal");
		expect(tiles.length).toBe(3);
	});
});
