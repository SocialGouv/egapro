import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeSearch } from "../HomeSearch";

describe("HomeSearch", () => {
	it("renders the section heading", () => {
		render(<HomeSearch />);
		expect(
			screen.getByRole("heading", {
				level: 2,
				name: "Consulter les résultats d'une entreprise",
			}),
		).toBeInTheDocument();
	});

	it("explains which results are public", () => {
		render(<HomeSearch />);
		expect(
			screen.getByText(
				/^Les résultats déclarés par les entreprises sont publics pour les indicateurs de rémunération/,
			),
		).toBeInTheDocument();
	});

	it("renders the search form", () => {
		render(<HomeSearch />);
		expect(
			screen.getByRole("form", { name: "Rechercher une entreprise" }),
		).toHaveAttribute("action", "/index-egapro/recherche");
	});

	it("hides the decorative illustration below md", () => {
		render(<HomeSearch />);
		const illustration = screen.getByTestId("next-image");
		expect(illustration).toHaveAttribute(
			"data-src",
			"/assets/images/home/search-illustration.svg",
		);
		expect(illustration.parentElement).toHaveClass(
			"fr-hidden",
			"fr-unhidden-md",
		);
		expect(illustration.parentElement).toHaveAttribute("aria-hidden", "true");
	});
});
