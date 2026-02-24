import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeResources } from "../HomeResources";

describe("HomeResources", () => {
	it("renders the FAQ tile", () => {
		render(<HomeResources />);
		expect(
			screen.getByRole("heading", {
				name: /questions fréquentes/i,
			}),
		).toBeInTheDocument();
	});

	it("renders the reference texts tile", () => {
		render(<HomeResources />);
		expect(
			screen.getByRole("heading", {
				name: /textes de référence/i,
			}),
		).toBeInTheDocument();
	});

	it("renders the contact tile", () => {
		render(<HomeResources />);
		expect(
			screen.getByRole("heading", {
				name: /nous contacter/i,
			}),
		).toBeInTheDocument();
	});

	it("links the FAQ tile to /faq", () => {
		render(<HomeResources />);
		expect(
			screen.getByRole("link", { name: /questions fréquentes/i }),
		).toHaveAttribute("href", "/faq");
	});

	it("links the reference texts tile to /textes-reference", () => {
		render(<HomeResources />);
		expect(
			screen.getByRole("link", { name: /textes de référence/i }),
		).toHaveAttribute("href", "/textes-reference");
	});

	it("links the contact tile to /contact", () => {
		render(<HomeResources />);
		expect(
			screen.getByRole("link", { name: /nous contacter/i }),
		).toHaveAttribute("href", "/contact");
	});

	it("renders the detail text for each tile", () => {
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

	it("uses horizontal tile layout", () => {
		const { container } = render(<HomeResources />);
		const tiles = container.querySelectorAll(".fr-tile--horizontal");
		expect(tiles.length).toBe(3);
	});
});
